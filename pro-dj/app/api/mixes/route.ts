import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireActiveSubscription } from "@/lib/subscription-guards";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const genre = searchParams.get("genre");
    const search = searchParams.get("search");
    const djId = searchParams.get("djId");
    const sortBy = searchParams.get("sortBy") || "newest";
    const featured = searchParams.get("featured") === "true";

    // Build where clause
    const where: any = {
      uploadStatus: "COMPLETED",
    };

    // Only show public mixes unless user is the DJ or admin
    if (
      !session?.user ||
      (session.user.role !== "DJ" && session.user.role !== "ADMIN")
    ) {
      where.isPublic = true;
    } else if (session.user.role === "DJ") {
      // DJs can see their own mixes + public mixes
      const djProfile = await prisma.djProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (djProfile) {
        where.OR = [{ isPublic: true }, { djId: djProfile.id }];
      } else {
        where.isPublic = true;
      }
    }

    // Apply filters
    if (genre && genre !== "All Genres") {
      where.genres = { has: genre };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search] } },
        {
          dj: {
            stageName: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    if (featured) {
      where.isFeatured = true;
    }

    if (djId) {
      where.djId = djId;
    }

    // Build order by clause
    let orderBy: any = {};
    switch (sortBy) {
      case "newest":
        orderBy.createdAt = "desc";
        break;
      case "oldest":
        orderBy.createdAt = "asc";
        break;
      case "popular":
        orderBy.playCount = "desc";
        break;
      case "title":
        orderBy.title = "asc";
        break;
      case "artist":
        orderBy.dj = { stageName: "asc" };
        break;
      default:
        orderBy.createdAt = "desc";
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch mixes
    const [mixes, total] = await Promise.all([
      prisma.djMix.findMany({
        where,
        orderBy,
        skip,
        take: limit,
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
      }),
      prisma.djMix.count({ where }),
    ]);

    // Fetch user like status for all mixes if user is authenticated
    let userLikes: string[] = [];
    if (session?.user?.id && mixes.length > 0) {
      try {
        const userLikeRecords = await prisma.mixLike.findMany({
          where: {
            userId: session.user.id,
            mixId: { in: mixes.map((mix) => mix.id) },
          },
          select: { mixId: true },
        });
        userLikes = userLikeRecords.map((like) => like.mixId);
      } catch (error) {
        console.error("Error fetching user likes:", error);
        // Continue without user likes rather than failing the entire request
        userLikes = [];
      }
    }

    // Generate URLs for mixes that don't have them
    const mixesWithUrls = mixes.map((mix) => {
      const cloudFrontUrl =
        mix.cloudFrontUrl ||
        (process.env.AWS_CLOUDFRONT_DOMAIN
          ? `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${mix.s3Key}`
          : null);

      // Use our optimized streaming endpoint
      const localUrl = mix.localUrl || `/api/mixes/stream?id=${mix.id}`;

      // Generate album art URL if not set
      let albumArtUrl = mix.albumArtUrl;
      if (!albumArtUrl && mix.albumArtS3Key) {
        if (process.env.AWS_CLOUDFRONT_DOMAIN) {
          albumArtUrl = `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${mix.albumArtS3Key}`;
        } else {
          // Generate direct S3 URL when CloudFront is not available
          albumArtUrl = `https://${
            process.env.AWS_S3_BUCKET_NAME || "pro-dj-mixes-v2"
          }.s3.${process.env.AWS_REGION || "us-east-2"}.amazonaws.com/${
            mix.albumArtS3Key
          }`;
        }
      }

      // Set albumArtUrl to null if it's empty or invalid
      if (!albumArtUrl || albumArtUrl === "/uploads/album-art/") {
        albumArtUrl = null;
      }

      // Use user's profile image
      const djProfileImage = mix.dj.user?.profileImage;

      return {
        ...mix,
        cloudFrontUrl,
        localUrl,
        albumArtUrl,
        userLiked: userLikes.includes(mix.id),
        dj: {
          ...mix.dj,
          userProfileImage: mix.dj.user?.profileImage,
        },
      };
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      ok: true,
      mixes: mixesWithUrls,
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
    console.error("Error fetching mixes:", error);

    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch mixes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
