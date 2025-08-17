import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search");
    const genre = searchParams.get("genre");
    const location = searchParams.get("location");
    const sortBy = searchParams.get("sortBy") || "featured"; // "featured", "name", "price", "rating"
    const featured = searchParams.get("featured") === "true";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      user: {
        role: "DJ",
        status: "ACTIVE",
      },
      isVerified: true,
      isActive: true,
    };

    if (search) {
      where.OR = [
        { stageName: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
        { specialties: { contains: search, mode: "insensitive" } },
        { user: { location: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (genre) {
      where.OR = [
        { genres: { has: genre } },
        { customGenres: { contains: genre, mode: "insensitive" } },
      ];
    }

    if (location) {
      where.OR = [
        { location: { contains: location, mode: "insensitive" } },
        { user: { location: { contains: location, mode: "insensitive" } } },
      ];
    }

    if (featured) {
      where.isFeatured = true;
    }

    // Build order by clause
    let orderBy: any = {};
    switch (sortBy) {
      case "name":
        orderBy.stageName = "asc";
        break;
      case "price":
        orderBy.basePriceCents = "asc";
        break;
      case "rating":
        orderBy.rating = "desc";
        break;
      case "featured":
      default:
        orderBy = [
          { isFeatured: "desc" },
          { rating: "desc" },
          { stageName: "asc" },
        ];
        break;
    }

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
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      }),
      prisma.djProfile.count({ where }),
    ]);

    // Calculate average ratings
    const djsWithRatings = djs.map((dj) => {
      const avgRating =
        dj.reviews.length > 0
          ? dj.reviews.reduce((sum, review) => sum + review.rating, 0) /
            dj.reviews.length
          : 0;

      return {
        id: dj.id,
        stageName: dj.stageName,
        genres: dj.genres || [],
        customGenres: dj.customGenres || "",
        basePriceCents: dj.basePriceCents || 0,
        bio: dj.bio || "",
        location: dj.user.location || dj.location || "Location not set",
        specialties: dj.specialties || "",
        equipment: dj.equipment || "",
        languages: dj.languages || [],
        availability: dj.availability || "",
        socialLinks: dj.socialLinks || {},
        profileImage: dj.user.profileImage,
        rating: avgRating,
        reviewCount: dj.reviews.length,
        isFeatured: dj.isFeatured,
      };
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      ok: true,
      djs: djsWithRatings,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching DJs:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch DJs" },
      { status: 500 }
    );
  }
}
