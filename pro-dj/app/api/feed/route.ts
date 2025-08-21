import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get user's feed (timeline of followed users' activity)
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Get users that the current user is following
    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    // If not following anyone, show reposts from all users
    if (followingIds.length === 0) {
      const allReposts = await prisma.repost.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
            },
          },
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
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      });

      const total = await prisma.repost.count();
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      const feed = allReposts.map((repost) => ({
        type: "repost" as const,
        id: repost.id,
        createdAt: repost.createdAt,
        user: repost.user,
        mix: repost.mix,
        priority: 2, // Lower priority for non-followed users
      }));

      return NextResponse.json({
        ok: true,
        feed,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      });
    }

    // Get all reposts (no following prerequisite)
    const allReposts = await prisma.repost.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
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
      orderBy: { createdAt: "desc" },
      take: Math.floor(limit * 0.7), // Reserve 70% for reposts
    });

    // Separate followed and non-followed reposts for priority sorting
    const followedReposts = allReposts.filter((repost) =>
      followingIds.includes(repost.userId)
    );
    const nonFollowedReposts = allReposts.filter(
      (repost) => !followingIds.includes(repost.userId)
    );

    // Get new mixes from followed DJs (excluding mixes the user has already reposted)
    const userRepostedMixIds = await prisma.repost.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        mixId: true,
      },
    });

    const repostedMixIds = userRepostedMixIds.map((r) => r.mixId);

    const remainingLimit = limit - allReposts.length;
    const newMixes =
      remainingLimit > 0
        ? await prisma.djMix.findMany({
            where: {
              dj: {
                userId: { in: followingIds },
              },
              isPublic: true,
              id: { notIn: repostedMixIds }, // Exclude mixes user has already reposted
            },
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
            orderBy: { createdAt: "desc" },
            take: remainingLimit, // Use remaining space for new mixes
          })
        : [];

    // Combine and sort by creation date
    const feed = [
      ...followedReposts.map((repost) => ({
        type: "repost" as const,
        id: repost.id,
        createdAt: repost.createdAt,
        user: repost.user,
        mix: repost.mix,
        priority: 1, // Higher priority for followed users
      })),
      ...nonFollowedReposts.map((repost) => ({
        type: "repost" as const,
        id: repost.id,
        createdAt: repost.createdAt,
        user: repost.user,
        mix: repost.mix,
        priority: 2, // Lower priority for non-followed users
      })),
      ...newMixes.map((mix) => ({
        type: "new_mix" as const,
        id: mix.id,
        createdAt: mix.createdAt,
        user: {
          id: mix.dj.userId,
          name: mix.dj.stageName,
          email: null,
          profileImage: mix.dj.user?.profileImage,
        },
        mix: {
          ...mix,
          dj: {
            ...mix.dj,
            userProfileImage: mix.dj.user?.profileImage,
          },
        },
        priority: 1, // Higher priority for followed users
      })),
    ]
      .sort((a, b) => {
        // First sort by priority, then by date
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      })
      // Deduplicate by mix ID - keep the first occurrence (highest priority/earliest)
      .filter((item, index, array) => {
        const mixId = item.mix.id;
        const firstIndex = array.findIndex(
          (feedItem) => feedItem.mix.id === mixId
        );
        return index === firstIndex;
      })
      .slice(0, limit); // Ensure we don't exceed the limit

    // Get total count for pagination
    const [totalRepostCount, mixCount] = await Promise.all([
      prisma.repost.count(),
      prisma.djMix.count({
        where: {
          dj: { userId: { in: followingIds } },
          isPublic: true,
          id: { notIn: repostedMixIds }, // Exclude mixes user has already reposted
        },
      }),
    ]);

    const total = totalRepostCount + mixCount;
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      ok: true,
      feed,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}
