import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch a specific event by name with all photos and comment counts
export async function GET(
  req: Request,
  { params }: { params: Promise<{ eventName: string }> }
) {
  try {
    const { eventName } = await params;
    const decodedEventName = decodeURIComponent(eventName);

    // Find all photos for this event
    const photos = await prisma.eventPhoto.findMany({
      where: { eventName: decodedEventName },
      include: {
        dj: {
          select: {
            id: true,
            stageName: true,
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
      orderBy: { createdAt: "desc" },
    });

    if (photos.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Group photos by DJ
    const djsMap = new Map();
    photos.forEach((photo) => {
      const djId = photo.djId;
      if (!djsMap.has(djId)) {
        djsMap.set(djId, {
          djId,
          stageName: photo.dj.stageName,
          userProfileImage: photo.dj.user?.profileImage || null,
          userId: photo.dj.userId,
          photos: [],
        });
      }
      djsMap.get(djId).photos.push({
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

    // Get event details from the first photo
    const firstPhoto = photos[0];
    const event = {
      eventName: firstPhoto.eventName,
      eventDate: firstPhoto.eventDate,
      eventType: firstPhoto.eventType,
      venue: firstPhoto.venue,
      location: firstPhoto.location,
      photos: Array.from(djsMap.values())[0].photos, // All photos from the event
      djs: Array.from(djsMap.values()),
    };

    return NextResponse.json({
      ok: true,
      event,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

// DELETE: Delete an entire event and all its photos
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ eventName: string }> }
) {
  const { eventName } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only allow DJs and admins to delete events
    if (session.user.role !== "DJ" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          ok: false,
          error: "Forbidden - Only DJs and admins can delete events",
        },
        { status: 403 }
      );
    }

    const decodedEventName = decodeURIComponent(eventName);

    // Get all photos for this event to check ownership
    const photos = await prisma.eventPhoto.findMany({
      where: { eventName: decodedEventName },
      include: {
        dj: {
          select: { userId: true },
        },
      },
    });

    if (photos.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if user owns all photos in this event (for DJs) or is admin
    if (session.user.role === "DJ") {
      const userPhotos = photos.filter(
        (photo) => photo.dj.userId === session.user.id
      );
      if (userPhotos.length !== photos.length) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Forbidden - You can only delete events where you own all photos",
          },
          { status: 403 }
        );
      }
    }

    // Delete all photos for this event
    const deleteResult = await prisma.eventPhoto.deleteMany({
      where: { eventName: decodedEventName },
    });

    return NextResponse.json({
      ok: true,
      message: `Event "${decodedEventName}" and ${deleteResult.count} photos deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
