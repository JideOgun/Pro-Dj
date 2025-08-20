import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT: Update DJ's social media links
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "DJ" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          ok: false,
          error: "Only DJs and Admins can update social media links",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { socialLinks } = body;

    if (!socialLinks || typeof socialLinks !== "object") {
      return NextResponse.json(
        { ok: false, error: "Social links are required" },
        { status: 400 }
      );
    }

    // Validate social links format
    const validPlatforms = [
      "instagram",
      "tiktok",
      "soundcloud",
      "youtube",
      "twitter",
      "facebook",
      "linkedin",
      "website",
    ];

    const validatedSocialLinks: Record<string, string> = {};

    for (const platform of validPlatforms) {
      if (socialLinks[platform] && typeof socialLinks[platform] === "string") {
        let value = socialLinks[platform].trim();

        // Clean up URLs/handles
        if (value) {
          // Remove @ symbol if present
          if (value.startsWith("@")) {
            value = value.substring(1);
          }

          // For website, ensure it has protocol
          if (platform === "website" && value && !value.startsWith("http")) {
            value = `https://${value}`;
          }

          validatedSocialLinks[platform] = value;
        }
      }
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

    // Update social links
    const updatedProfile = await prisma.djProfile.update({
      where: { id: djProfile.id },
      data: {
        socialLinks: validatedSocialLinks,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      profile: updatedProfile,
      message: "Social media links updated successfully",
    });
  } catch (error) {
    console.error("Error updating social media links:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update social media links" },
      { status: 500 }
    );
  }
}

// GET: Fetch DJ's social media links
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const djId = searchParams.get("djId");

    let targetUserId = session.user.id;

    // If djId is provided and user is admin, allow fetching other DJ's social links
    if (djId && session.user.role === "ADMIN") {
      targetUserId = djId;
    } else if (djId && djId !== session.user.id) {
      return NextResponse.json(
        { ok: false, error: "Not authorized to view other DJ's social links" },
        { status: 403 }
      );
    }

    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: targetUserId },
      select: {
        id: true,
        stageName: true,
        socialLinks: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!djProfile) {
      return NextResponse.json(
        { ok: false, error: "DJ profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      socialLinks: djProfile.socialLinks || {},
      dj: {
        id: djProfile.id,
        stageName: djProfile.stageName,
        user: djProfile.user,
      },
    });
  } catch (error) {
    console.error("Error fetching social media links:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch social media links" },
      { status: 500 }
    );
  }
}
