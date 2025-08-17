import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch YouTube videos with pagination and filtering
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const djId = searchParams.get("djId");
    const eventType = searchParams.get("eventType");
    const featured = searchParams.get("featured") === "true";
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "newest"; // "newest", "oldest", "popular", "title"

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      isPublic: true,
    };

    if (djId) {
      where.djId = djId;
    }

    if (eventType) {
      where.eventType = eventType;
    }

    if (featured) {
      where.isFeatured = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search] } },
      ];
    }

    // Build order by clause
    let orderBy: Record<string, string> = {};
    switch (sortBy) {
      case "oldest":
        orderBy.createdAt = "asc";
        break;
      case "popular":
        orderBy.viewCount = "desc";
        break;
      case "title":
        orderBy.title = "asc";
        break;
      case "newest":
      default:
        orderBy.createdAt = "desc";
        break;
    }

    // Fetch videos with pagination
    const [videos, total] = await Promise.all([
      prisma.djYouTubeVideo.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          dj: {
            select: {
              id: true,
              stageName: true,
              profileImage: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.djYouTubeVideo.count({ where }),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      ok: true,
      videos,
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
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

// POST: Create a new YouTube video (DJ only)
export async function POST(req: Request) {
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
        { ok: false, error: "Only DJs can add videos" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      youtubeUrl,
      eventType,
      eventDate,
      venue,
      location,
      tags,
      isFeatured,
      isPublic,
    } = body;

    if (!title || !youtubeUrl) {
      return NextResponse.json(
        { ok: false, error: "Title and YouTube URL are required" },
        { status: 400 }
      );
    }

    // Extract YouTube video ID from URL
    const youtubeIdMatch = youtubeUrl.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );

    if (!youtubeIdMatch) {
      return NextResponse.json(
        { ok: false, error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    const youtubeId = youtubeIdMatch[1];

    // Get DJ profile
    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!djProfile) {
      return NextResponse.json(
        { ok: false, error: "DJ profile not found" },
        { status: 404 }
      );
    }

    // Generate thumbnail URL
    const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

    // Create video record
    const video = await prisma.djYouTubeVideo.create({
      data: {
        djId: djProfile.id,
        title: title.trim(),
        description: description?.trim() || null,
        youtubeUrl,
        youtubeId,
        thumbnailUrl,
        duration: null, // Could be fetched from YouTube API later
        eventType: eventType || null,
        eventDate: eventDate ? new Date(eventDate) : null,
        venue: venue || null,
        location: location || null,
        tags: tags || [],
        isFeatured: isFeatured || false,
        isPublic: isPublic !== false, // Default to true
        sortOrder: 0,
      },
      include: {
        dj: {
          select: {
            id: true,
            stageName: true,
            profileImage: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      video,
    });
  } catch (error) {
    console.error("Error creating video:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create video" },
      { status: 500 }
    );
  }
}
