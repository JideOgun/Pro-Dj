import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

    // Parse request body
    const { mixId, duration, albumArtS3Key } = await req.json();

    if (!mixId) {
      return NextResponse.json(
        { ok: false, error: "Missing mix ID" },
        { status: 400 }
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

    // Generate proper album art URL if albumArtS3Key is provided
    let albumArtUrl = null;
    if (albumArtS3Key) {
      // Use the file serving API route which handles presigned URLs
      albumArtUrl = `/api/files/${albumArtS3Key}`;
    }

    // Update mix record
    const updatedMix = await prisma.djMix.update({
      where: {
        id: mixId,
        djId: djProfile.id, // Ensure the mix belongs to this DJ
      },
      data: {
        uploadStatus: "COMPLETED", // Use uploadStatus instead of status
        duration: duration || null,
        uploadedAt: new Date(),
        ...(albumArtS3Key && {
          albumArtS3Key: albumArtS3Key,
          albumArtUrl: albumArtUrl,
        }),
      },
    });

    // Fetch the complete mix data with DJ profile and user info
    const completeMix = await prisma.djMix.findUnique({
      where: { id: updatedMix.id },
      include: {
        dj: {
          select: {
            id: true,
            stageName: true,
            bio: true,
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
      data: {
        mix: completeMix,
        mixId: updatedMix.id,
        title: updatedMix.title,
        status: updatedMix.uploadStatus,
      },
    });
  } catch (error) {
    console.error("Error completing upload:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
