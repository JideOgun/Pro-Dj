import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE: Delete an entire event and all its photos
export async function DELETE(
  req: Request,
  { params }: { params: { eventName: string } }
) {
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

    const eventName = decodeURIComponent(params.eventName);

    // Get all photos for this event to check ownership
    const photos = await prisma.eventPhoto.findMany({
      where: { eventName },
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
      where: { eventName },
    });

    return NextResponse.json({
      ok: true,
      message: `Event "${eventName}" and ${deleteResult.count} photos deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
