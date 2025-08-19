// Instagram API route temporarily disabled until proper API integration
// import { NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { prisma } from "@/lib/prisma";

// Helper function to generate realistic mock Instagram posts
function generateMockInstagramPosts(stageName: string, limit: number) {
  const captions = [
    `Amazing night at the club! 🎵 #djlife #music #${stageName
      .toLowerCase()
      .replace(/\s+/g, "")}`,
    `Wedding vibes ✨ #weddingdj #afrobeats #${stageName
      .toLowerCase()
      .replace(/\s+/g, "")}`,
    `Live performance tonight! 🎤 #live #performance #${stageName
      .toLowerCase()
      .replace(/\s+/g, "")}`,
    `Studio session 🔥 #studio #music #${stageName
      .toLowerCase()
      .replace(/\s+/g, "")}`,
    `Birthday party vibes 🎉 #birthday #party #${stageName
      .toLowerCase()
      .replace(/\s+/g, "")}`,
    `Corporate event success! 💼 #corporate #event #${stageName
      .toLowerCase()
      .replace(/\s+/g, "")}`,
    `Beach party vibes 🌊 #beach #party #${stageName
      .toLowerCase()
      .replace(/\s+/g, "")}`,
    `New mix dropping soon! 🎧 #newmix #${stageName
      .toLowerCase()
      .replace(/\s+/g, "")}`,
    `Behind the scenes 🎬 #bts #djlife #${stageName
      .toLowerCase()
      .replace(/\s+/g, "")}`,
    `Soundcheck time 🔊 #soundcheck #${stageName
      .toLowerCase()
      .replace(/\s+/g, "")}`,
  ];

  const colors = [
    "6366f1",
    "8b5cf6",
    "a855f7",
    "ec4899",
    "f59e0b",
    "10b981",
    "06b6d4",
    "3b82f6",
    "ef4444",
    "f97316",
  ];

  const posts = [];
  for (let i = 0; i < limit; i++) {
    const color = colors[i % colors.length];
    const caption = captions[i % captions.length];
    const isVideo = i % 4 === 0;
    const daysAgo = i * 2; // Spread posts over time

    posts.push({
      id: `${stageName}_${i + 1}`,
      caption,
      mediaUrl: `https://via.placeholder.com/400x400/${color}/ffffff?text=${encodeURIComponent(
        stageName
      )}+Post+${i + 1}`,
      mediaType: isVideo ? "video" : "image",
      likes: Math.floor(Math.random() * 1000) + 100,
      comments: Math.floor(Math.random() * 100) + 10,
      timestamp: new Date(Date.now() - daysAgo * 86400000).toISOString(),
      permalink: `https://instagram.com/p/${stageName
        .toLowerCase()
        .replace(/\s+/g, "")}_${i + 1}`,
      dj: {
        stageName,
        profileImage: null,
      },
    });
  }

  return posts;
}

// GET: Fetch Instagram posts for a specific DJ or all DJs
// export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const djId = searchParams.get("djId");
    const limit = parseInt(searchParams.get("limit") || "12");
    const page = parseInt(searchParams.get("page") || "1");
    const offset = (page - 1) * limit;

    // If djId is provided, fetch posts for that specific DJ
    if (djId) {
      // Try to find DJ profile by ID first, then by userId
      let djProfile = await prisma.djProfile.findUnique({
        where: { id: djId },
        select: {
          id: true,
          stageName: true,
          socialLinks: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // If not found by ID, try to find by userId
      if (!djProfile) {
        djProfile = await prisma.djProfile.findUnique({
          where: { userId: djId },
          select: {
            id: true,
            stageName: true,
            socialLinks: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      }

      if (!djProfile) {
        return NextResponse.json(
          { ok: false, error: "DJ profile not found" },
          { status: 404 }
        );
      }

      if (!djProfile.socialLinks) {
        return NextResponse.json(
          { ok: false, error: "DJ has not set up social media links yet" },
          { status: 404 }
        );
      }

      const socialLinks = djProfile.socialLinks as any;
      const instagramHandle = socialLinks.instagram;

      if (!instagramHandle) {
        return NextResponse.json(
          { ok: false, error: "DJ has not connected their Instagram account" },
          { status: 404 }
        );
      }

      // Generate realistic mock data for this specific DJ
      const mockInstagramPosts = generateMockInstagramPosts(
        djProfile.stageName,
        limit
      );

      return NextResponse.json({
        ok: true,
        posts: mockInstagramPosts,
        instagramHandle,
        pagination: {
          page,
          limit,
          total: mockInstagramPosts.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    }

    // If no djId provided, fetch posts from all DJs with Instagram handles
    const djProfiles = await prisma.djProfile.findMany({
      where: {
        socialLinks: {
          not: null,
        },
      },
      select: {
        id: true,
        stageName: true,
        socialLinks: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Filter DJs with Instagram handles
    const djsWithInstagram = djProfiles.filter((dj) => {
      const socialLinks = dj.socialLinks as any;
      return socialLinks && socialLinks.instagram;
    });

    if (djsWithInstagram.length === 0) {
      return NextResponse.json({
        ok: true,
        posts: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    }

    // Generate mock posts from all DJs
    const allPosts = [];

    // Generate posts for each DJ
    djsWithInstagram.forEach((dj, djIndex) => {
      const postsPerDj = Math.ceil(24 / djsWithInstagram.length);
      const djPosts = generateMockInstagramPosts(dj.stageName, postsPerDj);

      // Add DJ posts to the main array
      allPosts.push(...djPosts);
    });

    // Sort by timestamp (newest first)
    allPosts.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Apply pagination
    const paginatedPosts = allPosts.slice(offset, offset + limit);
    const totalPages = Math.ceil(allPosts.length / limit);

    return NextResponse.json({
      ok: true,
      posts: paginatedPosts,
      pagination: {
        page,
        limit,
        total: allPosts.length,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  // } catch (error) {
  //   console.error("Error fetching Instagram posts:", error);
  //   return NextResponse.json(
  //     { ok: false, error: "Failed to fetch Instagram posts" },
  //     { status: 500 }
  //   );
  // }
}

// Placeholder API route for when Instagram integration is disabled
export async function GET(req: Request) {
  return NextResponse.json(
    { 
      ok: false, 
      error: "Instagram integration temporarily disabled during development",
      posts: [],
      pagination: {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      }
    },
    { status: 503 }
  );
}
