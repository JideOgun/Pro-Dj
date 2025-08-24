import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Creating DJ profile for user:", session.user.email);

    // Check if DJ profile already exists
    const existingProfile = await prisma.djProfile.findFirst({
      where: { userId: session.user.id },
    });

    if (existingProfile) {
      return NextResponse.json({
        ok: true,
        message: "DJ profile already exists",
        profile: {
          id: existingProfile.id,
          stageName: existingProfile.stageName,
          isApprovedByAdmin: existingProfile.isApprovedByAdmin,
        },
      });
    }

    // Create DJ profile
    const djProfile = await prisma.djProfile.create({
      data: {
        userId: session.user.id,
        stageName: session.user.name || "Admin DJ",
        bio: "Admin DJ profile for testing",
        basePriceCents: 5000, // $50
        isApprovedByAdmin: true, // Auto-approve admin
        isAvailableForBookings: true,
        acceptsBookings: true,
        maxFreeUploads: 999999, // Unlimited for admin
      },
    });

    console.log("DJ profile created:", djProfile.id);

    return NextResponse.json({
      ok: true,
      message: "DJ profile created successfully",
      profile: {
        id: djProfile.id,
        stageName: djProfile.stageName,
        isApprovedByAdmin: djProfile.isApprovedByAdmin,
      },
    });

  } catch (error) {
    console.error("Error creating DJ profile:", error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
