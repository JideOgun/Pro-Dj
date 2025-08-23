import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch comments for a specific item (mix, video, post)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const commentType = searchParams.get("type"); // "mix", "video", "post"
    const itemId = searchParams.get("itemId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "newest"; // "newest", "oldest", "popular"

    if (!commentType || !itemId) {
      return NextResponse.json(
        { ok: false, error: "Comment type and item ID are required" },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      commentType,
      isDeleted: false,
    };

    // Add the appropriate relation filter
    switch (commentType) {
      case "mix":
        where.mixId = itemId;
        break;
      case "video":
        where.videoId = itemId;
        break;
      case "post":
        where.postId = itemId;
        break;
      case "photo":
        where.photoId = itemId;
        break;
      default:
        return NextResponse.json(
          { ok: false, error: "Invalid comment type" },
          { status: 400 }
        );
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
        orderBy.likeCount = "desc";
        break;
      default:
        orderBy.createdAt = "desc";
    }

    // Fetch top-level comments (no parent)
    const [rawComments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          ...where,
          parentId: null, // Only top-level comments
        },
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              role: true,
            },
            include: {
              userMedia: {
                take: 1,
                orderBy: { createdAt: "desc" },
              },
            },
          },
          replies: {
            where: { isDeleted: false },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  profileImage: true,
                  role: true,
                },
                include: {
                  userMedia: {
                    take: 1,
                    orderBy: { createdAt: "desc" },
                  },
                },
              },
              likes: true,
              dislikes: true,
            },
            orderBy: { createdAt: "asc" },
          },
          likes: true,
          dislikes: true,
        },
      }),
      prisma.comment.count({
        where: {
          ...where,
          parentId: null,
        },
      }),
    ]);

    // Transform the comments to match the expected interface
    const comments = rawComments.map((comment) => ({
      ...comment,
      likes: comment.likes.length,
      dislikes: comment.dislikes.length,
      userLiked: comment.likes.some(
        (like) => like.userId === session?.user?.id
      ),
      userDisliked: comment.dislikes.some(
        (dislike) => dislike.userId === session?.user?.id
      ),
      replies: comment.replies.map((reply) => ({
        ...reply,
        likes: reply.likes.length,
        dislikes: reply.dislikes.length,
        userLiked: reply.likes.some(
          (like) => like.userId === session?.user?.id
        ),
        userDisliked: reply.dislikes.some(
          (dislike) => dislike.userId === session?.user?.id
        ),
      })),
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      ok: true,
      comments,
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
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST - Create a new comment
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
    const { content, commentType, itemId, parentId } = body;

    if (!content || !commentType || !itemId) {
      return NextResponse.json(
        { ok: false, error: "Content, comment type, and item ID are required" },
        { status: 400 }
      );
    }

    // Validate comment type
    if (!["mix", "video", "post", "photo"].includes(commentType)) {
      return NextResponse.json(
        { ok: false, error: "Invalid comment type" },
        { status: 400 }
      );
    }

    // Check if parent comment exists (for replies)
    let threadDepth = 0;
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { threadDepth: true },
      });

      if (!parentComment) {
        return NextResponse.json(
          { ok: false, error: "Parent comment not found" },
          { status: 404 }
        );
      }

      threadDepth = parentComment.threadDepth + 1;

      // Limit thread depth to 6 levels (allows 5-7 levels of conversation)
      if (threadDepth > 6) {
        return NextResponse.json(
          { ok: false, error: "Maximum reply depth reached" },
          { status: 400 }
        );
      }
    }

    // Build the comment data
    const commentData: any = {
      content: content.trim(),
      commentType,
      userId: session.user.id,
      threadDepth,
    };

    // Add the appropriate relation
    switch (commentType) {
      case "mix":
        commentData.mixId = itemId;
        break;
      case "video":
        commentData.videoId = itemId;
        break;
      case "post":
        commentData.postId = itemId;
        break;
      case "photo":
        commentData.photoId = itemId;
        break;
    }

    if (parentId) {
      commentData.parentId = parentId;
    }

    // Create the comment
    const rawComment = await prisma.comment.create({
      data: commentData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            role: true,
          },
        },
        likes: true,
        dislikes: true,
        replies: {
          where: { isDeleted: false },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
                role: true,
              },
            },
            likes: true,
            dislikes: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Transform the comment to match the expected interface
    const comment = {
      ...rawComment,
      likes: rawComment.likes.length,
      dislikes: rawComment.dislikes.length,
      userLiked: rawComment.likes.some(
        (like) => like.userId === session.user.id
      ),
      userDisliked: rawComment.dislikes.some(
        (dislike) => dislike.userId === session.user.id
      ),
      replies: rawComment.replies.map((reply) => ({
        ...reply,
        likes: reply.likes.length,
        dislikes: reply.dislikes.length,
        userLiked: reply.likes.some((like) => like.userId === session.user.id),
        userDisliked: reply.dislikes.some(
          (dislike) => dislike.userId === session.user.id
        ),
      })),
    };

    return NextResponse.json({
      ok: true,
      comment,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
