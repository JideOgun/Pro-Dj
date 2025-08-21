import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch featured DJs for homepage
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "6");
    const featured = searchParams.get("featured") === "true";

    // Build where clause - temporarily show all active DJs
    const whereClause: any = {
      isAcceptingBookings: true, // Only show DJs accepting bookings
    };

    // TODO: Add featured filter when DJs are marked as featured
    // if (featured) {
    //   whereClause.isFeatured = true;
    // }

    const djs = await prisma.djProfile.findMany({
      where: whereClause,
      select: {
        id: true,
        stageName: true,
        genres: true,
        location: true,
        experience: true,

        bio: true,
        isFeatured: true,
        rating: true,
        totalBookings: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            location: true,
          },
        },
        eventPhotos: {
          take: 3,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            url: true,
            title: true,
            eventName: true,
            eventType: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Format the response
    const formattedDjs = djs.map((dj) => ({
      id: dj.id,
      stageName: dj.stageName,
      genres: dj.genres,
      location: dj.user.location || dj.location || "Location not set",
      experience: dj.experience,

      bio: dj.bio,
      isFeatured: dj.isFeatured,
      userProfileImage: dj.user.profileImage,
      eventPhotos: dj.eventPhotos.map((photo) => ({
        id: photo.id,
        url: photo.url,
        title: photo.title,
        eventName: photo.eventName,
        eventType: photo.eventType,
      })),
      rating: dj.rating || 0,
      totalBookings: dj.totalBookings || 0,
    }));

    return NextResponse.json({ ok: true, data: formattedDjs });
  } catch (error) {
    console.error("Error fetching featured DJs:", error);
    return NextResponse.json({ error: "Failed to fetch DJs" }, { status: 500 });
  }
}
