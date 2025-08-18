import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch Instagram posts for a specific DJ or all DJs
export async function GET(req: Request) {
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

      // Return mock data for this specific DJ
      const mockInstagramPosts = [
        {
          id: "1",
          caption: "Amazing night at the club! 🎵 #djlife #music",
          mediaUrl:
            "https://via.placeholder.com/400x400/6366f1/ffffff?text=Instagram+Post+1",
          mediaType: "image",
          likes: 245,
          comments: 18,
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          permalink: `https://instagram.com/p/mock1`,
          dj: {
            stageName: djProfile.stageName || "DJ",
            profileImage: null,
          },
        },
        {
          id: "2",
          caption: "Wedding vibes ✨ #weddingdj #afrobeats",
          mediaUrl:
            "https://via.placeholder.com/400x400/8b5cf6/ffffff?text=Instagram+Post+2",
          mediaType: "image",
          likes: 189,
          comments: 12,
          timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          permalink: `https://instagram.com/p/mock2`,
          dj: {
            stageName: djProfile.stageName || "DJ",
            profileImage: null,
          },
        },
        {
          id: "3",
          caption: "Live performance tonight! 🎤 #live #performance",
          mediaUrl:
            "https://via.placeholder.com/400x400/a855f7/ffffff?text=Instagram+Post+3",
          mediaType: "video",
          likes: 567,
          comments: 34,
          timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          permalink: `https://instagram.com/p/mock3`,
          dj: {
            stageName: djProfile.stageName || "DJ",
            profileImage: null,
          },
        },
      ].slice(0, limit);

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
    const djNames = [
      "DJ AfroBeats",
      "DJ Vibes",
      "DJ Master",
      "DJ Groove",
      "DJ Pulse",
    ];

    for (let i = 0; i < 24; i++) {
      const djIndex = i % djsWithInstagram.length;
      const dj = djsWithInstagram[djIndex];
      const socialLinks = dj.socialLinks as any;

      allPosts.push({
        id: `post_${i + 1}`,
        caption: `Amazing ${
          i % 3 === 0
            ? "club night"
            : i % 3 === 1
            ? "wedding"
            : "live performance"
        }! 🎵 #djlife #music #afrobeats`,
        mediaUrl: `https://via.placeholder.com/400x400/${Math.floor(
          Math.random() * 0xffffff
        )
          .toString(16)
          .padStart(6, "0")}/ffffff?text=Post+${i + 1}`,
        mediaType: i % 4 === 0 ? "video" : "image",
        likes: Math.floor(Math.random() * 1000) + 100,
        comments: Math.floor(Math.random() * 100) + 10,
        timestamp: new Date(Date.now() - i * 86400000).toISOString(), // Spread over days
        permalink: `https://instagram.com/p/mock${i + 1}`,
        dj: {
          stageName: dj.stageName || djNames[djIndex],
          profileImage: null,
        },
      });
    }

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
  } catch (error) {
    console.error("Error fetching Instagram posts:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch Instagram posts" },
      { status: 500 }
    );
  }
}
