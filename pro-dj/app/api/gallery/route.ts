import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch all event photos grouped by event name
export async function GET() {
  try {
    // Get all event photos with DJ information
    const eventPhotos = await prisma.eventPhoto.findMany({
      where: {
        // Only show photos that have an event name
        eventName: {
          not: null,
        },
      },
      include: {
        dj: {
          select: {
            stageName: true,
            profileImage: true,
            userId: true,
          },
        },
      },
      orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
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

    return NextResponse.json({
      ok: true,
      events,
    });
  } catch (error) {
    console.error("Error fetching gallery:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch gallery" },
      { status: 500 }
    );
  }
}
