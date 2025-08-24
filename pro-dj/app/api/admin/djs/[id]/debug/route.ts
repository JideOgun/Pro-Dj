import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string  } }
) {
  const { id } = params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get detailed DJ information for debugging
    const user = await prisma.user.findUnique({
      where: { id: id },
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
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "DJ") {
      return NextResponse.json({ error: "User is not a DJ" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      debug: {
        userId: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        djProfile: user.djProfile
          ? {
              id: user.djProfile.id,
              stageName: user.djProfile.stageName,
              isApprovedByAdmin: user.djProfile.isApprovedByAdmin,
              isAcceptingBookings: user.djProfile.isAcceptingBookings,
              isFeatured: user.djProfile.isFeatured,
              createdAt: user.djProfile.createdAt,
              updatedAt: user.djProfile.updatedAt,
            }
          : null,
        bookingsCount: user.bookings.length,
        reviewsCount: user.reviews.length,
      },
    });
  } catch (error) {
    console.error("Error debugging DJ:", error);
    return NextResponse.json({ error: "Failed to debug DJ" }, { status: 500 });
  }
}
