import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: mixId } = await params;
    const userId = session.user.id;

    // Check if mix exists
    const mix = await prisma.djMix.findUnique({
      where: { id: mixId },
      select: { id: true, likeCount: true },
    });

    if (!mix) {
      return NextResponse.json({ error: "Mix not found" }, { status: 404 });
    }

    // Check if user already liked this mix
    const existingLike = await prisma.mixLike.findUnique({
      where: {
        mixId_userId: {
          mixId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike: Remove the like and decrease count
      await prisma.$transaction([
        prisma.mixLike.delete({
          where: {
            mixId_userId: {
              mixId,
              userId,
            },
          },
        }),
        prisma.djMix.update({
          where: { id: mixId },
          data: {
            likeCount: {
              decrement: 1,
            },
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        liked: false,
        likeCount: mix.likeCount - 1,
      });
    } else {
      // Like: Add the like and increase count
      await prisma.$transaction([
        prisma.mixLike.create({
          data: {
            mixId,
            userId,
          },
        }),
        prisma.djMix.update({
          where: { id: mixId },
          data: {
            likeCount: {
              increment: 1,
            },
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        liked: true,
        likeCount: mix.likeCount + 1,
      });
    }
  } catch (error) {
    console.error("Error toggling mix like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: mixId } = await params;
    const userId = session.user.id;

    // Check if user liked this mix
    const like = await prisma.mixLike.findUnique({
      where: {
        mixId_userId: {
          mixId,
          userId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      liked: !!like,
    });
  } catch (error) {
    console.error("Error checking mix like status:", error);
    return NextResponse.json(
      { error: "Failed to check like status" },
      { status: 500 }
    );
  }
}
