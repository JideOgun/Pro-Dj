import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch all event photos grouped by DJ, then by event
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const eventType = searchParams.get("eventType");
    const djId = searchParams.get("djId");
    const featured = searchParams.get("featured") === "true";
    const sortBy = searchParams.get("sortBy") || "date"; // "date", "newest", "oldest"

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      eventName: {
        not: null,
      },
    };

    if (eventType) {
      where.eventType = eventType;
    }

    if (djId) {
      where.djId = djId;
    }

    if (featured) {
      where.isFeatured = true;
    }

    // Build order by clause
    let orderBy: Array<Record<string, string>> = [];
    switch (sortBy) {
      case "newest":
        orderBy = [{ createdAt: "desc" }];
        break;
      case "oldest":
        orderBy = [{ createdAt: "asc" }];
        break;
      case "date":
      default:
        orderBy = [{ eventDate: "desc" }, { createdAt: "desc" }];
        break;
    }

    // Get event photos with pagination and comment counts
    const eventPhotos = await prisma.eventPhoto.findMany({
      where,
      include: {
        dj: {
          select: {
            id: true,
            stageName: true,
            profileImage: true,
            userId: true,
            user: {
              select: {
                profileImage: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // Group photos by DJ first, then by event
    const djsMap = new Map<
      string,
      {
        djId: string;
        stageName: string;
        profileImage: string | null;
        userProfileImage: string | null;
        userId: string;
        events: Map<
          string,
          {
            eventName: string;
            eventDate: Date | null;
            eventType: string | null;
            venue: string | null;
            location: string | null;
            photos: Array<{
              id: string;
              title: string;
              description: string | null;
              url: string;
              altText: string | null;
              tags: string[];
              isFeatured: boolean;
              commentCount: number;
              createdAt: Date;
            }>;
          }
        >;
      }
    >();

    eventPhotos.forEach((photo) => {
      const djId = photo.djId;
      const eventName = photo.eventName!;

      // Initialize DJ if not exists
      if (!djsMap.has(djId)) {
        djsMap.set(djId, {
          djId,
          stageName: photo.dj.stageName,
          profileImage: photo.dj.profileImage,
          userProfileImage: photo.dj.user?.profileImage || null,
          userId: photo.dj.userId,
          events: new Map(),
        });
      }

      const dj = djsMap.get(djId)!;

      // Initialize event if not exists
      if (!dj.events.has(eventName)) {
        dj.events.set(eventName, {
          eventName,
          eventDate: photo.eventDate,
          eventType: photo.eventType,
          venue: photo.venue,
          location: photo.location,
          photos: [],
        });
      }

      const event = dj.events.get(eventName)!;

      // Add photo to event
      event.photos.push({
        id: photo.id,
        title: photo.title,
        description: photo.description,
        url: photo.url,
        altText: photo.altText,
        tags: photo.tags,
        isFeatured: photo.isFeatured,
        commentCount: photo._count.comments,
        createdAt: photo.createdAt,
      });
    });

    // Convert to array format for response
    const djs = Array.from(djsMap.values()).map((dj) => ({
      ...dj,
      events: Array.from(dj.events.values()),
    }));

    // Get total count for pagination
    const totalPhotos = await prisma.eventPhoto.count({ where });

    return NextResponse.json({
      ok: true,
      djs,
      pagination: {
        page,
        limit,
        total: totalPhotos,
        totalPages: Math.ceil(totalPhotos / limit),
        hasMore: page * limit < totalPhotos,
      },
    });
  } catch (error) {
    console.error("Error fetching gallery:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch gallery" },
      { status: 500 }
    );
  }
}
