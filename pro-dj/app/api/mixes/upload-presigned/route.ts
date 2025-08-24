import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePresignedUploadUrl, generateS3Key } from "@/lib/aws";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get DJ profile
    const djProfile = await prisma.djProfile.findFirst({
      where: { userId: session.user.id },
    });

    if (!djProfile) {
      return NextResponse.json(
        { ok: false, error: "DJ profile not found" },
        { status: 404 }
      );
    }

    // Parse request body
    const { fileName, fileType, fileSize, title, description, genres } = await req.json();

    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { ok: false, error: "Missing required file information" },
        { status: 400 }
      );
    }

    // Check for duplicate title
    const existingTitleMix = await prisma.djMix.findFirst({
      where: {
        djId: djProfile.id,
        title: title || fileName.replace(/\.[^/.]+$/, ""),
      },
    });

    if (existingTitleMix) {
      return NextResponse.json(
        {
          ok: false,
          error: "A mix with this title already exists",
          details: {
            existingMixId: existingTitleMix.id,
            existingTitle: existingTitleMix.title,
            uploadedAt: existingTitleMix.createdAt,
          },
        },
        { status: 409 }
      );
    }

    // Generate S3 key
    const s3Key = generateS3Key(djProfile.id, fileName);

    // Generate presigned URL for direct upload
    const presignedUrl = await generatePresignedUploadUrl(s3Key, fileType, 3600); // 1 hour

    // Create mix record in database (without file URL yet)
    const mix = await prisma.djMix.create({
      data: {
        djId: djProfile.id,
        title: title || fileName.replace(/\.[^/.]+$/, ""),
        description: description || "",
        genres: genres || [],
        s3Key: s3Key,
        fileName: fileName,
        fileSize: fileSize,
        duration: null, // Will be updated after upload
        isPublic: true,
        status: "UPLOADING", // Will be updated to "ACTIVE" after successful upload
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        mixId: mix.id,
        presignedUrl: presignedUrl,
        s3Key: s3Key,
        fields: {}, // No additional fields needed for this implementation
      },
    });

  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
