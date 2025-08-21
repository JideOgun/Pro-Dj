import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch DJ profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        stageName: true,
        bio: true,
        genres: true,
        experience: true,
        location: true,

        eventsOffered: true,
        isAcceptingBookings: true,
        isApprovedByAdmin: true,
        isFeatured: true,
        socialLinks: true,
      },
    });

    if (!djProfile) {
      return NextResponse.json(
        { error: "DJ profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      profile: djProfile,
    });
  } catch (error) {
    console.error("Error fetching DJ profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PATCH - Update DJ profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      stageName,
      bio,
      genres,
      experience,
      location,

      eventsOffered,
      socialLinks,
      isAcceptingBookings,
    } = body;

    // Validate required fields
    if (stageName && stageName.trim().length === 0) {
      return NextResponse.json(
        { error: "Stage name cannot be empty" },
        { status: 400 }
      );
    }

    // Check if stage name is already taken (if changing)
    if (stageName) {
      const existingDj = await prisma.djProfile.findFirst({
        where: {
          stageName: stageName.trim(),
          userId: { not: session.user.id },
        },
      });

      if (existingDj) {
        return NextResponse.json(
          { error: "Stage name is already taken" },
          { status: 400 }
        );
      }
    }

    // Update profile
    const updatedProfile = await prisma.djProfile.update({
      where: { userId: session.user.id },
      data: {
        ...(stageName && { stageName: stageName.trim() }),
        ...(bio !== undefined && { bio }),
        ...(genres && { genres }),
        ...(experience !== undefined && { experience }),
        ...(location !== undefined && { location }),

        ...(eventsOffered && { eventsOffered }),
        ...(socialLinks && { socialLinks }),
        ...(isAcceptingBookings !== undefined && { isAcceptingBookings }),
      },
      select: {
        id: true,
        stageName: true,
        bio: true,
        genres: true,
        experience: true,
        location: true,

        eventsOffered: true,
        isAcceptingBookings: true,
        isApprovedByAdmin: true,
        isFeatured: true,
        socialLinks: true,
      },
    });

    return NextResponse.json({
      ok: true,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating DJ profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
