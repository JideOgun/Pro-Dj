import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCloudFrontUrl } from "@/lib/aws";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mixId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only DJs and Admins can complete uploads
    if (session.user.role !== "DJ" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "Only DJs and Admins can complete uploads" },
        { status: 403 }
      );
    }

    const { title, description, genre, tags, isPublic } = await req.json();

    // Get the mix and verify ownership
    const mix = await prisma.djMix.findUnique({
      where: { id: mixId },
      include: {
        dj: {
          select: { userId: true },
        },
      },
    });

    if (!mix) {
      return NextResponse.json(
        { ok: false, error: "Mix not found" },
        { status: 404 }
      );
    }

    // Verify the DJ owns this mix
    if (mix.dj.userId !== session.user.id) {
      return NextResponse.json(
        { ok: false, error: "You can only complete your own uploads" },
        { status: 403 }
      );
    }

    // Generate CloudFront URL if available
    let cloudFrontUrl = null;
    try {
      cloudFrontUrl = generateCloudFrontUrl(mix.s3Key);
    } catch (error) {
      console.warn("CloudFront not configured, using S3 URL");
    }

    // Update the mix with completion data
    const updatedMix = await prisma.djMix.update({
      where: { id: mixId },
      data: {
        title: title || mix.title,
        description,
        genre,
        tags: tags || [],
        isPublic: isPublic || false,
        cloudFrontUrl,
        uploadStatus: "COMPLETED",
        uploadProgress: 100,
        uploadedAt: new Date(),
      },
      include: {
        dj: {
          select: {
            stageName: true,
            user: {
              select: {
                profileImage: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      mix: updatedMix,
      message: "Mix upload completed successfully",
    });
  } catch (error) {
    console.error("Error completing mix upload:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to complete upload" },
      { status: 500 }
    );
  }
}
