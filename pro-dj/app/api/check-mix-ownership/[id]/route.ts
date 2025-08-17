import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mixId } = await params;

    const mix = await prisma.djMix.findUnique({
      where: { id: mixId },
      include: {
        dj: {
          select: {
            id: true,
            stageName: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!mix) {
      return NextResponse.json({
        ok: false,
        message: "Mix not found",
        mixId,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Mix found",
      mix: {
        id: mix.id,
        title: mix.title,
        dj: {
          id: mix.dj.id,
          stageName: mix.dj.stageName,
          user: mix.dj.user,
        },
      },
    });
  } catch (error) {
    console.error("Error checking mix ownership:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to check mix ownership",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
