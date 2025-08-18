import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch a specific photo with comment count
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const photoId = await params.then((p) => p.id);

    const photo = await prisma.eventPhoto.findUnique({
      where: { id: photoId },
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
    });

    if (!photo) {
      return NextResponse.json(
        { ok: false, error: "Photo not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      photo: {
        ...photo,
        commentCount: photo._count.comments,
      },
    });
  } catch (error) {
    console.error("Error fetching photo:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch photo" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a specific photo
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

    // Only allow DJs and admins to delete photos
    if (session.user.role !== "DJ" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          ok: false,
          error: "Forbidden - Only DJs and admins can delete photos",
        },
        { status: 403 }
      );
    }

    const photoId = params.id;

    // Get the photo to check ownership
    const photo = await prisma.eventPhoto.findUnique({
      where: { id: photoId },
      include: {
        dj: {
          select: { userId: true },
        },
      },
    });

    if (!photo) {
      return NextResponse.json(
        { ok: false, error: "Photo not found" },
        { status: 404 }
      );
    }

    // Check if user owns the photo (for DJs) or is admin
    if (session.user.role === "DJ" && photo.dj.userId !== session.user.id) {
      return NextResponse.json(
        { ok: false, error: "Forbidden - You can only delete your own photos" },
        { status: 403 }
      );
    }

    // Delete the photo
    await prisma.eventPhoto.delete({
      where: { id: photoId },
    });

    return NextResponse.json({
      ok: true,
      message: "Photo deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}
