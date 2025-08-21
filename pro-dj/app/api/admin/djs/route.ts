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
    const djs = await prisma.user.findMany({
      where: { role: "DJ" },
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

    return NextResponse.json({
      djs,
      total: djs.length,
    });
  } catch (error) {
    console.error("Error fetching DJs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
