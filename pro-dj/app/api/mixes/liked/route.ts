import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get mixes liked by the current user
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
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get liked mixes for the current user
    const likedMixes = await prisma.mixLike.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        mix: {
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
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Transform the data to match the expected format
    const mixes = likedMixes.map((like) => ({
      id: like.mix.id,
      title: like.mix.title,
      duration: like.mix.duration,
      cloudFrontUrl: like.mix.cloudFrontUrl,
      localUrl: like.mix.localUrl,
      albumArtUrl: like.mix.albumArtUrl,
      dj: like.mix.dj,
      likedAt: like.createdAt.toISOString(),
    }));

    return NextResponse.json({
      ok: true,
      mixes,
      total: mixes.length,
    });
  } catch (error) {
    console.error("Error fetching liked mixes:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch liked mixes" },
      { status: 500 }
    );
  }
}
