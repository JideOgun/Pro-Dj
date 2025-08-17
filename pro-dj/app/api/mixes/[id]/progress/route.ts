import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only DJs can update progress
    if (session.user.role !== "DJ") {
      return NextResponse.json(
        { ok: false, error: "Only DJs can update upload progress" },
        { status: 403 }
      );
    }

    const mixId = params.id;
    const { progress, status } = await req.json();

    // Validate progress
    if (typeof progress !== "number" || progress < 0 || progress > 100) {
      return NextResponse.json(
        { ok: false, error: "Invalid progress value" },
        { status: 400 }
      );
    }

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
        { ok: false, error: "You can only update your own uploads" },
        { status: 403 }
      );
    }

    // Update the mix progress
    const updateData: any = {
      uploadProgress: progress,
    };

    // Update status if provided
    if (
      status &&
      ["PENDING", "UPLOADING", "COMPLETED", "FAILED", "CANCELLED"].includes(
        status
      )
    ) {
      updateData.uploadStatus = status;
    }

    // Set uploadedAt if completed
    if (progress === 100) {
      updateData.uploadedAt = new Date();
    }

    const updatedMix = await prisma.djMix.update({
      where: { id: mixId },
      data: updateData,
    });

    return NextResponse.json({
      ok: true,
      mix: updatedMix,
    });
  } catch (error) {
    console.error("Error updating upload progress:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update progress" },
      { status: 500 }
    );
  }
}

