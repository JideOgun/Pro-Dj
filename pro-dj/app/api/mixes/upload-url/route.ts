import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generatePresignedUploadUrl,
  generateS3Key,
  isValidAudioFormat,
  isValidFileSize,
  getFileExtension,
} from "@/lib/aws";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only DJs can upload mixes
    if (session.user.role !== "DJ" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "Only DJs and Admins can upload mixes" },
        { status: 403 }
      );
    }

    const { fileName, fileSize, mimeType } = await req.json();

    // Validate file
    if (!fileName || !fileSize || !mimeType) {
      return NextResponse.json(
        { ok: false, error: "Missing required file information" },
        { status: 400 }
      );
    }

    // Validate file format
    if (!isValidAudioFormat(mimeType)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid audio format. Supported formats: MP3, WAV, OGG, M4A, AAC",
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (!isValidFileSize(fileSize)) {
      return NextResponse.json(
        { ok: false, error: "File too large. Maximum size is 200MB" },
        { status: 400 }
      );
    }

    // Get DJ profile
    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!djProfile) {
      return NextResponse.json(
        { ok: false, error: "DJ profile not found" },
        { status: 404 }
      );
    }

    // Generate S3 key
    const s3Key = generateS3Key(djProfile.id, fileName);

    // Generate presigned URL
    const presignedUrl = await generatePresignedUploadUrl(s3Key, mimeType);

    // Create mix record in database
    const mix = await prisma.djMix.create({
      data: {
        djId: djProfile.id,
        title: fileName.replace(/\.[^/.]+$/, ""), // Remove extension
        fileName,
        originalName: fileName,
        fileSize,
        mimeType,
        format: getFileExtension(mimeType),
        s3Key,
        uploadStatus: "PENDING",
        uploadProgress: 0,
      },
    });

    return NextResponse.json({
      ok: true,
      uploadUrl: presignedUrl,
      mixId: mix.id,
      s3Key,
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
