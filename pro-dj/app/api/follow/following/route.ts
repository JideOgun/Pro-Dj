import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get users that the current user is following
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const following = await prisma.follow.findMany({
      where: {
        followerId: session.user.id,
      },
      select: {
        followingId: true,
        following: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      ok: true,
      following,
      total: following.length,
    });
  } catch (error) {
    console.error("Error fetching following users:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch following users" },
      { status: 500 }
    );
  }
}
