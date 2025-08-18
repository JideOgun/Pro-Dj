import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch TikTok videos for a DJ
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const djId = searchParams.get("djId");
    const limit = parseInt(searchParams.get("limit") || "12");

    if (!djId) {
      return NextResponse.json(
        { ok: false, error: "DJ ID is required" },
        { status: 400 }
      );
    }

    // Get DJ's TikTok handle from social links
    const djProfile = await prisma.djProfile.findUnique({
      where: { id: djId },
      select: { socialLinks: true },
    });

    if (!djProfile || !djProfile.socialLinks) {
      return NextResponse.json(
        { ok: false, error: "DJ not found or no social links" },
        { status: 404 }
      );
    }

    const socialLinks = djProfile.socialLinks as any;
    const tiktokHandle = socialLinks.tiktok;

    if (!tiktokHandle) {
      return NextResponse.json(
        { ok: false, error: "No TikTok handle found" },
        { status: 404 }
      );
    }

    // TODO: Implement actual TikTok API integration
    // For now, return mock data
    const mockTikTokVideos = [
      {
        id: "1",
        description: "Amazing DJ set at the club! 🎵 #djlife #music #tiktok",
        videoUrl:
          "https://via.placeholder.com/400x600/000000/ffffff?text=TikTok+Video+1",
        thumbnailUrl:
          "https://via.placeholder.com/400x600/000000/ffffff?text=TikTok+Thumb+1",
        likes: 1245,
        comments: 89,
        shares: 45,
        views: 15600,
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        permalink: `https://tiktok.com/@${tiktokHandle}/video/mock1`,
        duration: "00:30",
      },
      {
        id: "2",
        description: "Wedding vibes ✨ #weddingdj #afrobeats #tiktok",
        videoUrl:
          "https://via.placeholder.com/400x600/000000/ffffff?text=TikTok+Video+2",
        thumbnailUrl:
          "https://via.placeholder.com/400x600/000000/ffffff?text=TikTok+Thumb+2",
        likes: 892,
        comments: 67,
        shares: 23,
        views: 8900,
        timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        permalink: `https://tiktok.com/@${tiktokHandle}/video/mock2`,
        duration: "00:45",
      },
      {
        id: "3",
        description: "Live performance tonight! 🎤 #live #performance #tiktok",
        videoUrl:
          "https://via.placeholder.com/400x600/000000/ffffff?text=TikTok+Video+3",
        thumbnailUrl:
          "https://via.placeholder.com/400x600/000000/ffffff?text=TikTok+Thumb+3",
        likes: 2156,
        comments: 134,
        shares: 78,
        views: 23400,
        timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        permalink: `https://tiktok.com/@${tiktokHandle}/video/mock3`,
        duration: "01:15",
      },
    ].slice(0, limit);

    return NextResponse.json({
      ok: true,
      videos: mockTikTokVideos,
      tiktokHandle,
      pagination: {
        limit,
        total: mockTikTokVideos.length,
        hasMore: false, // Would be true if there were more videos
      },
    });
  } catch (error) {
    console.error("Error fetching TikTok videos:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch TikTok videos" },
      { status: 500 }
    );
  }
}
