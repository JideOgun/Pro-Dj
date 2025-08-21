import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch a single mix by ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mixId } = await params;
    const session = await getServerSession(authOptions);

    // Find the mix
    const mix = await prisma.djMix.findUnique({
      where: { id: mixId },
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
      },
    });

    if (!mix) {
      return NextResponse.json({ error: "Mix not found" }, { status: 404 });
    }

    // Check if user liked this mix
    let userLiked = false;
    if (session?.user?.id) {
      const like = await prisma.mixLike.findUnique({
        where: {
          mixId_userId: {
            mixId,
            userId: session.user.id,
          },
        },
      });
      userLiked = !!like;
    }

    // Use user's profile image
    const djProfileImage = mix.dj.user?.profileImage;

    // Generate album art URL if needed
    let albumArtUrl = mix.albumArtUrl;
    if (mix.albumArtS3Key && !albumArtUrl) {
      if (process.env.AWS_S3_BUCKET_NAME && process.env.AWS_REGION) {
        albumArtUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${mix.albumArtS3Key}`;
      } else {
        albumArtUrl = `/uploads/album-art/${mix.albumArtS3Key
          .split("/")
          .pop()}`;
      }
    }

    // Increment play count
    await prisma.djMix.update({
      where: { id: mixId },
      data: { playCount: { increment: 1 } },
    });

    return NextResponse.json({
      ok: true,
      mix: {
        id: mix.id,
        title: mix.title,
        description: mix.description,
        genres: mix.genres,
        tags: mix.tags,
        duration: mix.duration,
        s3Key: mix.s3Key,
        cloudFrontUrl: mix.cloudFrontUrl,
        localUrl: `/api/mixes/stream?id=${mix.id}`,
        albumArtUrl,
        createdAt: mix.createdAt,
        playCount: mix.playCount + 1, // Include the increment
        downloadCount: mix.downloadCount,
        likeCount: mix.likeCount,
        userLiked,
        dj: {
          ...mix.dj,
          userProfileImage: mix.dj.user?.profileImage,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching mix:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch mix" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a mix (owner or admin only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: mixId } = await params;

    // Get the mix to check ownership
    const mix = await prisma.djMix.findUnique({
      where: { id: mixId },
      include: {
        dj: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!mix) {
      return NextResponse.json(
        { ok: false, error: "Mix not found" },
        { status: 404 }
      );
    }

    // Check if user is authorized to delete (owner or admin)
    const isOwner = mix.dj.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized to delete this mix" },
        { status: 403 }
      );
    }

    // Delete the mix (this will cascade delete likes and comments due to schema constraints)
    await prisma.djMix.delete({
      where: { id: mixId },
    });

    return NextResponse.json({
      ok: true,
      message: "Mix deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting mix:", error);

    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to delete mix",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
