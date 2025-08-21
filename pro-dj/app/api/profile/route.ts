import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { upload, processAndSaveImage, UPLOAD_TYPES } from "@/lib/upload";

// GET - Get user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        djProfile: true,
        userMedia: {
          where: { type: "PROFILE_PICTURE" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// POST - Update user profile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, location, bio, website, socialLinks, djProfile } =
      body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        location: location || undefined,
        bio: bio || undefined,
        website: website || undefined,
        socialLinks: socialLinks || undefined,
      },
      include: {
        djProfile: true,
        userMedia: {
          where: { type: "PROFILE_PICTURE" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // Update DJ profile if provided and user has a DJ profile
    if (djProfile && updatedUser.djProfile) {
      await prisma.djProfile.update({
        where: { id: updatedUser.djProfile.id },
        data: {
          stageName: djProfile.stageName || undefined,
          bio: djProfile.bio || undefined,
          genres: djProfile.genres || undefined,
          experience: djProfile.experience || undefined,
        },
      });
    }

    // Fetch the updated user with DJ profile data
    const finalUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        djProfile: true,
        userMedia: {
          where: { type: "PROFILE_PICTURE" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return NextResponse.json({ ok: true, data: finalUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

// Handle file uploads with multer
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // This would need to be handled differently in Next.js App Router
    // For now, we'll handle file uploads in a separate route
    return NextResponse.json(
      { error: "Use /api/profile/upload for file uploads" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error handling upload:", error);
    return NextResponse.json(
      { error: "Failed to handle upload" },
      { status: 500 }
    );
  }
}
