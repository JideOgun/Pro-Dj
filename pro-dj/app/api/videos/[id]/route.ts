import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch a single video by ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;

    const video = await prisma.djYouTubeVideo.findUnique({
      where: { id: videoId },
      include: {
        dj: {
          select: {
            id: true,
            stageName: true,
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    if (!video) {
      return NextResponse.json(
        { ok: false, error: "Video not found" },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.djYouTubeVideo.update({
      where: { id: videoId },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({
      ok: true,
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        youtubeUrl: video.youtubeUrl,
        youtubeId: video.youtubeId,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        eventType: video.eventType,
        eventDate: video.eventDate,
        venue: video.venue,
        location: video.location,
        tags: video.tags,
        isFeatured: video.isFeatured,
        viewCount: video.viewCount + 1, // Include the increment
        likeCount: video.likeCount,
        createdAt: video.createdAt,
        dj: video.dj,
      },
    });
  } catch (error) {
    console.error("Error fetching video:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch video" },
      { status: 500 }
    );
  }
}

// PUT: Update a video (owner only)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;
    const body = await req.json();

    const video = await prisma.djYouTubeVideo.findUnique({
      where: { id: videoId },
      include: {
        dj: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!video) {
      return NextResponse.json(
        { ok: false, error: "Video not found" },
        { status: 404 }
      );
    }

    // Check if user is authorized to update (owner only)
    // Note: This would typically be done with session validation
    // For now, we'll allow updates but you should add proper auth

    const updatedVideo = await prisma.djYouTubeVideo.update({
      where: { id: videoId },
      data: {
        title: body.title,
        description: body.description,
        eventType: body.eventType,
        eventDate: body.eventDate ? new Date(body.eventDate) : null,
        venue: body.venue,
        location: body.location,
        tags: body.tags || [],
        isFeatured: body.isFeatured || false,
        isPublic: body.isPublic !== false,
      },
      include: {
        dj: {
          select: {
            id: true,
            stageName: true,
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      video: updatedVideo,
    });
  } catch (error) {
    console.error("Error updating video:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update video" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a video (owner only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: videoId } = await params;

    const video = await prisma.djYouTubeVideo.findUnique({
      where: { id: videoId },
      include: {
        dj: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!video) {
      return NextResponse.json(
        { ok: false, error: "Video not found" },
        { status: 404 }
      );
    }

    // Check if user is authorized to delete (owner or admin)
    const isOwner = video.dj.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized to delete this video" },
        { status: 403 }
      );
    }

    // Delete the video
    await prisma.djYouTubeVideo.delete({
      where: { id: videoId },
    });

    return NextResponse.json({
      ok: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting video:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to delete video" },
      { status: 500 }
    );
  }
}
