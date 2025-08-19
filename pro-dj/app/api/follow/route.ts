import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Follow a user
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userIdToFollow } = body;

    if (!userIdToFollow) {
      return NextResponse.json(
        { ok: false, error: "User ID to follow is required" },
        { status: 400 }
      );
    }

    // Prevent self-following
    if (session.user.id === userIdToFollow) {
      return NextResponse.json(
        { ok: false, error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    // Check if user to follow exists
    const userToFollow = await prisma.user.findUnique({
      where: { id: userIdToFollow },
    });

    if (!userToFollow) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userIdToFollow,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { ok: false, error: "Already following this user" },
        { status: 400 }
      );
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: userIdToFollow,
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      follow,
      message: "Successfully followed user",
    });
  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to follow user" },
      { status: 500 }
    );
  }
}

// DELETE - Unfollow a user
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userIdToUnfollow = searchParams.get("userId");

    if (!userIdToUnfollow) {
      return NextResponse.json(
        { ok: false, error: "User ID to unfollow is required" },
        { status: 400 }
      );
    }

    // Delete follow relationship
    const deletedFollow = await prisma.follow.deleteMany({
      where: {
        followerId: session.user.id,
        followingId: userIdToUnfollow,
      },
    });

    if (deletedFollow.count === 0) {
      return NextResponse.json(
        { ok: false, error: "Not following this user" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Successfully unfollowed user",
    });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to unfollow user" },
      { status: 500 }
    );
  }
}

// GET - Get follow status and counts
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || session.user.id;

    // Get follow counts
    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({
        where: { followingId: userId },
      }),
      prisma.follow.count({
        where: { followerId: userId },
      }),
    ]);

    // Check if current user is following this user
    let isFollowing = false;
    if (userId !== session.user.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: userId,
          },
        },
      });
      isFollowing = !!follow;
    }

    return NextResponse.json({
      ok: true,
      data: {
        followersCount,
        followingCount,
        isFollowing,
      },
    });
  } catch (error) {
    console.error("Error getting follow data:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to get follow data" },
      { status: 500 }
    );
  }
}
