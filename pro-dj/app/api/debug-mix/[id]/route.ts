import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string  } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: mixId } = params;

    if (!session?.user) {
      return NextResponse.json({
        ok: false,
        message: "No session found",
        mixId,
      });
    }

    const mix = await prisma.djMix.findUnique({
      where: { id: mixId },
      include: { dj: true },
    });

    if (!mix) {
      return NextResponse.json({
        ok: false,
        message: "Mix not found",
        mixId,
      });
    }

    const canDelete =
      mix.dj.id === session.user.id || session.user.role === "ADMIN";

    return NextResponse.json({
      ok: true,
      message: "Mix found",
      mixId,
      mix: {
        id: mix.id,
        title: mix.title,
        dj: {
          id: mix.dj.id,
          stageName: mix.dj.stageName,
        },
      },
      user: {
        id: session.user.id,
        role: session.user.role,
      },
      authorization: {
        canDelete,
        reason: canDelete
          ? "User owns mix or is admin"
          : "User doesn't own mix and is not admin",
      },
    });
  } catch (error) {
    console.error("Error getting mix:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to get mix",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
