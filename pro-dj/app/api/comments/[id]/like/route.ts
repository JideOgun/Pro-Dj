import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Like or unlike a comment
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
        { ok: false, error: "Cannot like deleted comment" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Check if user already liked the comment
    const existingLike = comment.likes.find((like) => like.userId === userId);
    const existingDislike = comment.dislikes.find(
      (dislike) => dislike.userId === userId
    );

    if (existingLike) {
      // Unlike the comment
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

      return NextResponse.json({
        ok: true,
        liked: false,
        message: "Comment unliked",
      });
    } else {
      // Like the comment
      await prisma.$transaction([
        prisma.commentLike.create({
          data: {
            commentId: id,
            userId,
          },
        }),
        prisma.comment.update({
          where: { id },
          data: {
            likeCount: {
              increment: 1,
            },
          },
        }),
      ]);

      // If user had disliked, remove the dislike
      if (existingDislike) {
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
      }

      return NextResponse.json({
        ok: true,
        liked: true,
        message: "Comment liked",
      });
    }
  } catch (error) {
    console.error("Error liking comment:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to like comment" },
      { status: 500 }
    );
  }
}
