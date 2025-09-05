import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const location = searchParams.get("location") || "";
    const genres = searchParams.get("genres")?.split(",").filter(Boolean) || [];
    const eventTypes =
      searchParams.get("eventTypes")?.split(",").filter(Boolean) || [];
    // Note: minPrice, maxPrice, and featured filters are not currently implemented
    // const minPrice = parseInt(searchParams.get("minPrice") || "0");
    // const maxPrice = parseInt(searchParams.get("maxPrice") || "1000");
    // const featured = searchParams.get("featured") === "true";

    const skip = (page - 1) * limit;

    // Build where clause - load all DJs regardless of status
    const where: Record<string, unknown> = {
      user: {
        role: {
          in: ["DJ", "ADMIN"], // Include both DJs and admins who are also DJs
        },
      },
    };

    // Search functionality
    if (search) {
      where.OR = [
        { stageName: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Location filter
    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }

    // Genre filter
    if (genres.length > 0) {
      where.genres = { hasSome: genres };
    }

    // Event types filter
    if (eventTypes.length > 0) {
      where.eventsOffered = { hasSome: eventTypes };
    }

    // Price filter - TODO: Implement when we have base pricing in DjProfile
    // For now, we'll filter by DjEventPricing in the response
    // if (minPrice > 0 || maxPrice < 1000) {
    //   where.basePriceCents = {
    //     gte: minPrice * 100, // Convert to cents
    //     lte: maxPrice * 100, // Convert to cents
    //   };
    // }

    // Build order by clause - just by name for simplicity
    const orderBy = [{ stageName: "asc" as const }];

    // Fetch DJs with pagination
    const [djs, total] = await Promise.all([
      prisma.djProfile.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              location: true,
              profileImage: true,
            },
          },
          mixes: {
            select: {
              id: true,
            },
          },
          eventPhotos: {
            select: {
              id: true,
            },
          },
          youtubeVideos: {
            select: {
              id: true,
            },
          },
          djEventPricing: {
            select: {
              eventType: true,
              hourlyRateCents: true,
              description: true,
            },
          },
        },
      }),
      prisma.djProfile.count({ where }),
    ]);

    // Format DJ data for frontend
    const formattedDjs = djs.map((dj) => {
      return {
        id: dj.id,
        userId: dj.userId,
        stageName: dj.stageName,
        bio: dj.bio || "",
        profileImage: dj.user.profileImage,
        genres: dj.genres || [],
        experience: dj.experience || 0,
        location: dj.location || dj.user.location || "",
        basePriceCents: 0, // TODO: Get from DjEventPricing when needed
        eventsOffered: dj.eventsOffered || [],
        isApprovedByAdmin: dj.isApprovedByAdmin,
        isFeatured: dj.isFeatured,
        isAcceptingBookings: dj.isAcceptingBookings,
        totalMixes: dj.mixes.length,
        totalEvents: dj.eventPhotos.length,
        averageRating: 0, // TODO: Add rating calculation if needed
        eventPricing: dj.djEventPricing || [],
      };
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      ok: true,
      djs: formattedDjs,
      totalPages,
      totalDjs: total,
    });
  } catch (error) {
    console.error("Error fetching DJs:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch DJs" },
      { status: 500 }
    );
  }
}
