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
    const { mixId, fileName, fileType, fileSize } = await req.json();

    if (!mixId || !fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { ok: false, error: "Missing required information" },
        { status: 400 }
      );
    }

    // Verify the mix belongs to this DJ
    const mix = await prisma.djMix.findFirst({
      where: {
        id: mixId,
        djId: djProfile.id,
      },
    });

    if (!mix) {
      return NextResponse.json(
        { ok: false, error: "Mix not found or access denied" },
        { status: 404 }
      );
    }

    // Generate S3 key for album art
    const albumArtS3Key = generateS3Key(djProfile.id, `album-art/${fileName}`);

    // Generate presigned URL for direct upload
    const presignedUrl = await generatePresignedUploadUrl(albumArtS3Key, fileType, 3600); // 1 hour

    return NextResponse.json({
      ok: true,
      data: {
        presignedUrl: presignedUrl,
        albumArtS3Key: albumArtS3Key,
        fields: {},
      },
    });

  } catch (error) {
    console.error("Error generating album art presigned URL:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
