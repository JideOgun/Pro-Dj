import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get all DJ users first
    const djUsers = await prisma.user.findMany({
      where: {
        role: "DJ",
        status: "ACTIVE",
      },
    });

    // Then get their profiles
    const djsWithProfiles = await Promise.all(
      djUsers.map(async (user) => {
        const profile = await prisma.djProfile.findUnique({
          where: { userId: user.id },
        });

        if (profile && profile.isVerified && profile.isActive) {
          return {
            id: profile.id,
            stageName: profile.stageName,
            genres: profile.genres || [],
            customGenres: profile.customGenres || "",
            basePriceCents: profile.basePriceCents || 0,
            bio: profile.bio || "",
            location: profile.location || "",
            specialties: profile.specialties || "",
            equipment: profile.equipment || "",
            languages: profile.languages || [],
            availability: profile.availability || "",
            socialLinks: profile.socialLinks || {},
          };
        }
        return null;
      })
    );

    const formattedDjs = djsWithProfiles.filter(Boolean);

    return NextResponse.json(
      {
        ok: true,
        data: formattedDjs,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching DJs:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch DJs" },
      { status: 500 }
    );
  }
}
