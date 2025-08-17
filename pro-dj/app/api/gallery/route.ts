import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch all event photos grouped by event name
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

    // Get event photos with pagination
    const eventPhotos = await prisma.eventPhoto.findMany({
      where,
      include: {
        dj: {
          select: {
            stageName: true,
            profileImage: true,
            userId: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // Group photos by event name
    const eventsMap = new Map<
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
          dj: {
            stageName: string;
            profileImage: string | null;
            userId: string;
          };
          createdAt: Date;
        }>;
      }
    >();

    eventPhotos.forEach((photo) => {
      const eventName = photo.eventName!;

      if (!eventsMap.has(eventName)) {
        eventsMap.set(eventName, {
          eventName,
          eventDate: photo.eventDate,
          eventType: photo.eventType,
          venue: photo.venue,
          location: photo.location,
          photos: [],
        });
      }

      const event = eventsMap.get(eventName)!;
      event.photos.push({
        id: photo.id,
        title: photo.title,
        description: photo.description,
        url: photo.url,
        altText: photo.altText,
        tags: photo.tags,
        isFeatured: photo.isFeatured,
        dj: {
          stageName: photo.dj.stageName,
          profileImage: photo.dj.profileImage,
          userId: photo.dj.userId,
        },
        createdAt: photo.createdAt,
      });
    });

    // Convert map to array and sort by event date (most recent first)
    const events = Array.from(eventsMap.values()).sort((a, b) => {
      if (!a.eventDate && !b.eventDate) return 0;
      if (!a.eventDate) return 1;
      if (!b.eventDate) return -1;
      return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
    });

    // Get total count for pagination
    const total = await prisma.eventPhoto.count({ where });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      ok: true,
      events,
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
    console.error("Error fetching gallery:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch gallery" },
      { status: 500 }
    );
  }
}
