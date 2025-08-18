import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch DJ dashboard statistics
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "DJ") {
      return NextResponse.json(
        { ok: false, error: "Only DJs can access dashboard stats" },
        { status: 403 }
      );
    }

    // Get DJ profile
    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            profileImage: true,
          },
        },
      },
    });

    if (!djProfile) {
      return NextResponse.json(
        { ok: false, error: "DJ profile not found" },
        { status: 404 }
      );
    }

    // Get DJ's mixes
    const mixes = await prisma.djMix.findMany({
      where: { djId: djProfile.id },
      select: {
        id: true,
        playCount: true,
        downloadCount: true,
      },
    });

    // Get DJ's bookings
    const bookings = await prisma.booking.findMany({
      where: { djId: djProfile.id },
      select: {
        id: true,
        status: true,
        quotedPriceCents: true,
        eventDate: true,
      },
    });

    // Calculate statistics
    const totalMixes = mixes.length;
    const totalPlays = mixes.reduce(
      (sum, mix) => sum + (mix.playCount || 0),
      0
    );
    const totalDownloads = mixes.reduce(
      (sum, mix) => sum + (mix.downloadCount || 0),
      0
    );

    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED");
    const totalEarnings = confirmedBookings.reduce(
      (sum, booking) => sum + (booking.quotedPriceCents || 0),
      0
    );

    // Calculate upcoming events (bookings in the future)
    const now = new Date();
    const upcomingEvents = bookings.filter(
      (booking) => booking.eventDate && new Date(booking.eventDate) > now
    ).length;

    // Mock average rating (in a real app, this would come from reviews)
    const averageRating = 4.5;

    const stats = {
      totalMixes,
      totalBookings,
      totalEarnings: Math.round(totalEarnings / 100), // Convert cents to dollars
      averageRating,
      totalPlays,
      upcomingEvents,
      totalDownloads,
    };

    return NextResponse.json({
      ok: true,
      stats,
      profile: {
        id: djProfile.id,
        stageName: djProfile.stageName,
        bio: djProfile.bio,
        profileImage: djProfile.user.profileImage || djProfile.profileImage,
        genres: djProfile.genres,
        experience: djProfile.experience,
        location: djProfile.location,
        hourlyRate: djProfile.hourlyRate,
        isVerified: djProfile.isVerified,
        isFeatured: djProfile.isFeatured,
      },
    });
  } catch (error) {
    console.error("Error fetching DJ dashboard stats:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
