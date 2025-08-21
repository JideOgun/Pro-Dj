import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logTaxDataAccess, type TaxDataAccessLog } from "@/lib/security-utils";

const verifySchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

// POST - Verify tax information (admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = verifySchema.parse(body);

    // Get client IP
    const clientIP =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Find the security clearance record
    const securityClearance = await prisma.securityClearance.findUnique({
      where: { userId: validatedData.userId },
    });

    if (!securityClearance) {
      return NextResponse.json(
        { error: "Security clearance not found" },
        { status: 404 }
      );
    }

    if (securityClearance.isVerified) {
      return NextResponse.json(
        { error: "Tax information is already verified" },
        { status: 400 }
      );
    }

    // Update verification status
    await prisma.securityClearance.update({
      where: { userId: validatedData.userId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: session.user.id,
        lastAccessedAt: new Date(),
        lastAccessedBy: session.user.id,
        accessCount: { increment: 1 },
        ipAddress: clientIP,
      },
    });

    // Log verification for audit
    const accessLog: TaxDataAccessLog = {
      userId: validatedData.userId,
      accessedBy: session.user.id,
      accessType: "UPDATE",
      ipAddress: clientIP,
      userAgent: req.headers.get("user-agent") || "unknown",
      timestamp: new Date(),
      dataFields: ["verification_status"],
    };
    logTaxDataAccess(accessLog);

    return NextResponse.json({
      success: true,
      message: "Tax information verified successfully",
    });
  } catch (error) {
    console.error("Error verifying tax information:", error);

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
