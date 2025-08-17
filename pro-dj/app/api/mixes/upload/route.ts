import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { s3Client } from "@/lib/aws";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import {
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

    if (session.user.role !== "DJ") {
      return NextResponse.json(
        { ok: false, error: "Only DJs can upload mixes" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const genre = formData.get("genre") as string;
    const tags = formData.get("tags") as string;
    const isPublic = formData.get("isPublic") === "true";

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file
    if (!isValidAudioFormat(file.type)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid audio format. Supported formats: MP3, WAV, OGG, M4A, AAC",
        },
        { status: 400 }
      );
    }

    if (!isValidFileSize(file.size)) {
      return NextResponse.json(
        {
          ok: false,
          error: "File too large. Maximum size is 200MB",
        },
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
    const s3Key = generateS3Key(djProfile.id, file.name);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("Uploading to S3:", {
      bucket: process.env.AWS_S3_BUCKET_NAME || "pro-dj-mixes-v2",
      key: s3Key,
      fileSize: buffer.length,
      contentType: file.type,
    });

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || "pro-dj-mixes-v2",
      Key: s3Key,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(uploadCommand);

    // Generate URLs for playback
    const cloudFrontUrl = process.env.AWS_CLOUDFRONT_DOMAIN
      ? `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${s3Key}`
      : null;

    // Use our optimized streaming endpoint
    const localUrl = `/api/mixes/stream?key=${encodeURIComponent(s3Key)}`;

    // Create mix record in database
    const mix = await prisma.djMix.create({
      data: {
        djId: djProfile.id,
        title: title || file.name.replace(/\.[^/.]+$/, ""),
        description,
        genre,
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
        isPublic: isPublic || false,
        fileName: file.name,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        format: getFileExtension(file.type),
        s3Key,
        cloudFrontUrl,
        localUrl,
        uploadStatus: "COMPLETED",
        uploadProgress: 100,
        uploadedAt: new Date(),
      },
      include: {
        dj: {
          select: {
            stageName: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      mix,
      message: "Mix uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading mix:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to upload mix",
      },
      { status: 500 }
    );
  }
}
