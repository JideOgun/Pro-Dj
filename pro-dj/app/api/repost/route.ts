import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Repost a mix
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
    const { mixId } = body;

    if (!mixId) {
      return NextResponse.json(
        { ok: false, error: "Mix ID is required" },
        { status: 400 }
      );
    }

    // Check if mix exists
    const mix = await prisma.djMix.findUnique({
      where: { id: mixId },
      include: {
        dj: {
          select: {
            id: true,
            stageName: true,
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

    // Prevent users from reposting their own mixes
    if (mix.dj.userId === session.user.id) {
      return NextResponse.json(
        { ok: false, error: "You cannot repost your own mix" },
        { status: 400 }
      );
    }

    // Check if already reposted
    const existingRepost = await prisma.repost.findUnique({
      where: {
        userId_mixId: {
          userId: session.user.id,
          mixId,
        },
      },
    });

    if (existingRepost) {
      return NextResponse.json(
        { ok: false, error: "Already reposted this mix" },
        { status: 400 }
      );
    }

    // Create repost
    const repost = await prisma.repost.create({
      data: {
        userId: session.user.id,
        mixId,
      },
      include: {
        mix: {
          include: {
            dj: {
              select: {
                id: true,
                stageName: true,
                userId: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      repost,
      message: "Successfully reposted mix",
    });
  } catch (error) {
    console.error("Error reposting mix:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to repost mix" },
      { status: 500 }
    );
  }
}

// DELETE - Remove repost
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
    const mixId = searchParams.get("mixId");

    if (!mixId) {
      return NextResponse.json(
        { ok: false, error: "Mix ID is required" },
        { status: 400 }
      );
    }

    // Delete repost
    const deletedRepost = await prisma.repost.deleteMany({
      where: {
        userId: session.user.id,
        mixId,
      },
    });

    if (deletedRepost.count === 0) {
      return NextResponse.json(
        { ok: false, error: "Repost not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Successfully removed repost",
    });
  } catch (error) {
    console.error("Error removing repost:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to remove repost" },
      { status: 500 }
    );
  }
}

// GET - Get repost status and count
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
    const mixId = searchParams.get("mixId");

    if (!mixId) {
      return NextResponse.json(
        { ok: false, error: "Mix ID is required" },
        { status: 400 }
      );
    }

    // Get repost count for this mix
    const repostCount = await prisma.repost.count({
      where: { mixId },
    });

    // Check if current user has reposted this mix
    const userRepost = await prisma.repost.findUnique({
      where: {
        userId_mixId: {
          userId: session.user.id,
          mixId,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        repostCount,
        hasReposted: !!userRepost,
      },
    });
  } catch (error) {
    console.error("Error getting repost data:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to get repost data" },
      { status: 500 }
    );
  }
}
