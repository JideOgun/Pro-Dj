import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logTaxDataAccess, type TaxDataAccessLog } from "@/lib/security-utils";

// GET - List all security clearances (admin only)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get client IP
    const clientIP =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Retrieve all security clearances with user information
    const clearances = await prisma.securityClearance.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Log access for audit
    const accessLog: TaxDataAccessLog = {
      userId: "SYSTEM_LIST",
      accessedBy: session.user.id,
      accessType: "VIEW",
      ipAddress: clientIP,
      userAgent: req.headers.get("user-agent") || "unknown",
      timestamp: new Date(),
      dataFields: ["list_overview"],
    };
    logTaxDataAccess(accessLog);

    // Return sanitized data (no encrypted tax IDs)
    const sanitizedClearances = clearances.map((clearance) => ({
      id: clearance.id,
      userId: clearance.userId,
      taxIdLastFour: clearance.taxIdLastFour,
      taxIdType: clearance.taxIdType,
      businessName: clearance.businessName,
      businessAddress: clearance.businessAddress,
      businessPhone: clearance.businessPhone,
      isCorporation: clearance.isCorporation,
      isSoleProprietor: clearance.isSoleProprietor,
      businessType: clearance.businessType,
      lastAccessedAt: clearance.lastAccessedAt,
      lastAccessedBy: clearance.lastAccessedBy,
      accessCount: clearance.accessCount,
      isVerified: clearance.isVerified,
      verifiedAt: clearance.verifiedAt,
      verifiedBy: clearance.verifiedBy,
      dataRetentionDate: clearance.dataRetentionDate,
      isRetentionSuspended: clearance.isRetentionSuspended,
      createdAt: clearance.createdAt,
      updatedAt: clearance.updatedAt,
      user: clearance.user,
    }));

    return NextResponse.json({
      clearances: sanitizedClearances,
      total: clearances.length,
    });
  } catch (error) {
    console.error("Error retrieving security clearances:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
