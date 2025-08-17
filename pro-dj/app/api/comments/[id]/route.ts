import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT - Update a comment
export async function PUT(
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
    const body = await req.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: "Comment content is required" },
        { status: 400 }
      );
    }

    // Find the comment and check ownership
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!comment) {
      return NextResponse.json(
        { ok: false, error: "Comment not found" },
        { status: 404 }
      );
    }

    if (comment.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "You can only edit your own comments" },
        { status: 403 }
      );
    }

    if (comment.isDeleted) {
      return NextResponse.json(
        { ok: false, error: "Cannot edit deleted comment" },
        { status: 400 }
      );
    }

    // Update the comment
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        content: content.trim(),
        isEdited: true,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            role: true,
          },
        },
        likes: true,
        dislikes: true,
      },
    });

    return NextResponse.json({
      ok: true,
      comment: updatedComment,
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update comment" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a comment (soft delete)
export async function DELETE(
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

    // Find the comment and check ownership
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!comment) {
      return NextResponse.json(
        { ok: false, error: "Comment not found" },
        { status: 404 }
      );
    }

    if (comment.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "You can only delete your own comments" },
        { status: 403 }
      );
    }

    if (comment.isDeleted) {
      return NextResponse.json(
        { ok: false, error: "Comment already deleted" },
        { status: 400 }
      );
    }

    // Soft delete the comment
    await prisma.comment.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
