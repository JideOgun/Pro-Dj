import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  encryptTaxId,
  decryptTaxId,
  getTaxIdLastFour,
  validateTaxId,
  determineTaxIdType,
  hasSecurityClearance,
  logTaxDataAccess,
  calculateDataRetentionDate,
  type TaxDataAccessLog,
} from "@/lib/security-utils";

const taxInfoSchema = z.object({
  taxId: z.string().min(1, "Tax ID is required"),
  businessName: z.string().optional(),
  businessAddress: z.string().optional(),
  businessPhone: z.string().optional(),
  isCorporation: z.boolean().default(false),
  isSoleProprietor: z.boolean().default(true),
  businessType: z
    .enum(["SOLE_PROPRIETOR", "LLC", "CORPORATION", "PARTNERSHIP"])
    .optional(),
});

// GET - Retrieve tax information (admin only or own data)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId") || session.user.id;

    // Check security clearance
    if (
      !hasSecurityClearance(session.user.role, targetUserId, session.user.id)
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get client IP
    const clientIP =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Retrieve encrypted tax information
    const securityClearance = await prisma.securityClearance.findUnique({
      where: { userId: targetUserId },
    });

    if (!securityClearance) {
      return NextResponse.json(
        { error: "No tax information found" },
        { status: 404 }
      );
    }

    // Update access tracking
    await prisma.securityClearance.update({
      where: { userId: targetUserId },
      data: {
        lastAccessedAt: new Date(),
        lastAccessedBy: session.user.id,
        accessCount: { increment: 1 },
        ipAddress: clientIP,
      },
    });

    // Log access for audit
    const accessLog: TaxDataAccessLog = {
      userId: targetUserId,
      accessedBy: session.user.id,
      accessType: "VIEW",
      ipAddress: clientIP,
      userAgent: req.headers.get("user-agent") || "unknown",
      timestamp: new Date(),
      dataFields: ["taxId", "businessInfo"],
    };
    logTaxDataAccess(accessLog);

    // Return sanitized data (never return full decrypted tax ID via API)
    return NextResponse.json({
      id: securityClearance.id,
      taxIdLastFour: securityClearance.taxIdLastFour,
      taxIdType: securityClearance.taxIdType,
      businessName: securityClearance.businessName,
      businessAddress: securityClearance.businessAddress,
      businessPhone: securityClearance.businessPhone,
      isCorporation: securityClearance.isCorporation,
      isSoleProprietor: securityClearance.isSoleProprietor,
      businessType: securityClearance.businessType,
      isVerified: securityClearance.isVerified,
      verifiedAt: securityClearance.verifiedAt,
      createdAt: securityClearance.createdAt,
      updatedAt: securityClearance.updatedAt,
    });
  } catch (error) {
    console.error("Error retrieving tax information:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create or update tax information
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = taxInfoSchema.parse(body);
    const targetUserId = body.userId || session.user.id;

    // Check security clearance
    if (
      !hasSecurityClearance(session.user.role, targetUserId, session.user.id)
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Validate tax ID format
    const taxIdType = determineTaxIdType(validatedData.taxId);
    if (taxIdType === "UNKNOWN") {
      return NextResponse.json(
        { error: "Invalid tax ID format" },
        { status: 400 }
      );
    }

    if (!validateTaxId(validatedData.taxId, taxIdType)) {
      return NextResponse.json(
        { error: `Invalid ${taxIdType} format` },
        { status: 400 }
      );
    }

    // Encrypt the tax ID
    const { encrypted, iv, tag } = encryptTaxId(validatedData.taxId);
    const encryptedTaxId = `${encrypted}:${iv}:${tag}`;
    const taxIdLastFour = getTaxIdLastFour(validatedData.taxId);

    // Get client IP
    const clientIP =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Create or update security clearance record
    const securityClearance = await prisma.securityClearance.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        encryptedTaxId,
        taxIdLastFour,
        taxIdType,
        businessName: validatedData.businessName,
        businessAddress: validatedData.businessAddress,
        businessPhone: validatedData.businessPhone,
        isCorporation: validatedData.isCorporation,
        isSoleProprietor: validatedData.isSoleProprietor,
        businessType: validatedData.businessType,
        lastAccessedAt: new Date(),
        lastAccessedBy: session.user.id,
        accessCount: 1,
        ipAddress: clientIP,
        dataRetentionDate: calculateDataRetentionDate(new Date()),
      },
      update: {
        encryptedTaxId,
        taxIdLastFour,
        taxIdType,
        businessName: validatedData.businessName,
        businessAddress: validatedData.businessAddress,
        businessPhone: validatedData.businessPhone,
        isCorporation: validatedData.isCorporation,
        isSoleProprietor: validatedData.isSoleProprietor,
        businessType: validatedData.businessType,
        lastAccessedAt: new Date(),
        lastAccessedBy: session.user.id,
        accessCount: { increment: 1 },
        ipAddress: clientIP,
        updatedAt: new Date(),
      },
    });

    // Log access for audit
    const accessLog: TaxDataAccessLog = {
      userId: targetUserId,
      accessedBy: session.user.id,
      accessType: securityClearance ? "UPDATE" : "CREATE",
      ipAddress: clientIP,
      userAgent: req.headers.get("user-agent") || "unknown",
      timestamp: new Date(),
      dataFields: ["taxId", "businessInfo"],
    };
    logTaxDataAccess(accessLog);

    return NextResponse.json({
      success: true,
      message: "Tax information saved securely",
    });
  } catch (error) {
    console.error("Error saving tax information:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove tax information (admin only)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get client IP
    const clientIP =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Delete the security clearance record
    await prisma.securityClearance.delete({
      where: { userId: targetUserId },
    });

    // Log deletion for audit
    const accessLog: TaxDataAccessLog = {
      userId: targetUserId,
      accessedBy: session.user.id,
      accessType: "DELETE",
      ipAddress: clientIP,
      userAgent: req.headers.get("user-agent") || "unknown",
      timestamp: new Date(),
      dataFields: ["all"],
    };
    logTaxDataAccess(accessLog);

    return NextResponse.json({
      success: true,
      message: "Tax information deleted",
    });
  } catch (error) {
    console.error("Error deleting tax information:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
