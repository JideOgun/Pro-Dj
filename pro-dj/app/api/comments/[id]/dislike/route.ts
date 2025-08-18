import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Dislike or undislike a comment
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        likes: true,
        dislikes: true,
      },
    });

    if (!comment) {
      return NextResponse.json(
        { ok: false, error: "Comment not found" },
        { status: 404 }
      );
    }

    if (comment.isDeleted) {
      return NextResponse.json(
        { ok: false, error: "Cannot dislike deleted comment" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Check if user already disliked the comment
    const existingDislike = comment.dislikes.find(
      (dislike) => dislike.userId === userId
    );
    const existingLike = comment.likes.find((like) => like.userId === userId);

    if (existingDislike) {
      // Undislike the comment
      await prisma.$transaction([
        prisma.commentDislike.delete({
          where: { id: existingDislike.id },
        }),
        prisma.comment.update({
          where: { id },
          data: {
            dislikeCount: {
              decrement: 1,
            },
          },
        }),
      ]);

      // Get updated comment with new counts
      const updatedComment = await prisma.comment.findUnique({
        where: { id },
        include: {
          likes: true,
          dislikes: true,
        },
      });

      return NextResponse.json({
        ok: true,
        disliked: false,
        dislikeCount: updatedComment?.dislikes.length || 0,
        message: "Comment undisliked",
      });
    } else {
      // Dislike the comment
      await prisma.$transaction([
        prisma.commentDislike.create({
          data: {
            commentId: id,
            userId,
          },
        }),
        prisma.comment.update({
          where: { id },
          data: {
            dislikeCount: {
              increment: 1,
            },
          },
        }),
      ]);

      // If user had liked, remove the like
      if (existingLike) {
        await prisma.$transaction([
          prisma.commentLike.delete({
            where: { id: existingLike.id },
          }),
          prisma.comment.update({
            where: { id },
            data: {
              likeCount: {
                decrement: 1,
              },
            },
          }),
        ]);
      }

      // Get updated comment with new counts
      const updatedComment = await prisma.comment.findUnique({
        where: { id },
        include: {
          likes: true,
          dislikes: true,
        },
      });

      return NextResponse.json({
        ok: true,
        disliked: true,
        dislikeCount: updatedComment?.dislikes.length || 0,
        message: "Comment disliked",
      });
    }
  } catch (error) {
    console.error("Error disliking comment:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to dislike comment" },
      { status: 500 }
    );
  }
}
