import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const djs = await prisma.user.findMany({
      where: {
        role: "DJ",
        djProfile: { isNot: null }, // Only users with DJ profiles
      },
      include: {
        djProfile: {
          select: {
            id: true,
            stageName: true,
            genres: true,
            customGenres: true,
            basePriceCents: true,
            bio: true,
            location: true,
            specialties: true,
            equipment: true,
            languages: true,
            availability: true,
            socialLinks: true,
          },
        },
      },
      orderBy: {
        djProfile: {
          stageName: "asc",
        },
      },
    });

    const formattedDjs = djs.map((dj) => ({
      id: dj.djProfile?.id || dj.id, // Use DjProfile.id for booking references
      stageName: dj.djProfile?.stageName || "Unknown DJ",
      genres: dj.djProfile?.genres || [],
      customGenres: dj.djProfile?.customGenres || "",
      basePriceCents: dj.djProfile?.basePriceCents || 0,
      bio: dj.djProfile?.bio || "",
      location: dj.djProfile?.location || "",
      specialties: dj.djProfile?.specialties || "",
      equipment: dj.djProfile?.equipment || "",
      languages: dj.djProfile?.languages || [],
      availability: dj.djProfile?.availability || "",
      socialLinks: dj.djProfile?.socialLinks || {},
    }));

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
