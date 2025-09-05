import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePresignedUploadUrl, generateS3Key } from "@/lib/aws";
import { getOrCreateAdminDjProfile } from "@/lib/admin-dj-utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get or create DJ profile (auto-creates for admin users)
    let djProfile;
    try {
      djProfile = await getOrCreateAdminDjProfile(session.user.id);
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: "Failed to get or create DJ profile" },
        { status: 500 }
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

    // Check for duplicate title - only active mixes
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
        originalName: fileName, // Add the missing originalName field
        fileSize: fileSize,
        duration: null, // Will be updated after upload
        isPublic: true,
        uploadStatus: "PENDING", // Use uploadStatus instead of status
        mimeType: fileType, // Add required mimeType field
        tags: [], // Add empty tags array
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
