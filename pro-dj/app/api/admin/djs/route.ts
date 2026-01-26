import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasAdminPrivileges } from "@/lib/auth-utils";

// GET - Fetch all DJs for admin management
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasAdminPrivileges(session.user)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get all DJs with their profiles and stats
    // Include admin users who also have DJ profiles
    const djs = await prisma.user.findMany({
      where: {
        OR: [
          { role: "DJ" },
          { role: "ADMIN" }, // Include admins who may have DJ profiles
        ],
      },
      include: {
        djProfile: true,
        bookings: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter to only users who have DJ profiles
    const djsWithProfiles = djs.filter((user) => user.djProfile !== null);

    // Ensure admin DJs are always ACTIVE (update user.status, not contractorStatus)
    await Promise.all(
      djsWithProfiles.map(async (user) => {
        if (user.role === "ADMIN" && user.status !== "ACTIVE") {
          await prisma.user.update({
            where: { id: user.id },
            data: { status: "ACTIVE" },
          });
          // Update the local object
          user.status = "ACTIVE";
        }
      })
    );

    return NextResponse.json({
      djs: djsWithProfiles,
      total: djsWithProfiles.length,
    });
  } catch (error) {
    console.error("Error fetching DJs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
