import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const djProfileSchema = z.object({
  stageName: z.string().min(1, "Stage name is required").max(100),
  bio: z.string().max(1000).optional(),
  genres: z.array(z.string()).min(1, "At least one genre is required"),
  customGenres: z.string().max(200).optional(),
  experience: z.number().min(0).max(50),
  location: z.string().min(1, "Location is required").max(200),
  travelRadius: z.number().min(0).max(500).optional(),
  specialties: z.string().max(500).optional(),
  equipment: z.string().max(500).optional(),
  languages: z.array(z.string()).optional(),
  availability: z.string().max(500).optional(),
  socialLinks: z
    .object({
      instagram: z.string().url().optional().or(z.literal("")),
      youtube: z.string().url().optional().or(z.literal("")),
      soundcloud: z.string().url().optional().or(z.literal("")),
      website: z.string().url().optional().or(z.literal("")),
    })
    .optional(),
  basePriceCents: z.number().min(0).optional(),
  profileImage: z.union([z.string().url(), z.literal("")]).optional(),
  portfolio: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check if user is already a DJ
    const existingDjProfile = await prisma.djProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (existingDjProfile) {
      return NextResponse.json(
        { ok: false, error: "DJ profile already exists" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = djProfileSchema.parse(body);

    // Create DJ profile
    const djProfile = await prisma.djProfile.create({
      data: {
        userId: session.user.id,
        stageName: validatedData.stageName,
        bio: validatedData.bio,
        genres: validatedData.genres,
        customGenres: validatedData.customGenres,
        experience: validatedData.experience,
        location: validatedData.location,
        travelRadius: validatedData.travelRadius || 50,
        specialties: validatedData.specialties,
        equipment: validatedData.equipment,
        languages: validatedData.languages || [],
        availability: validatedData.availability,
        socialLinks: validatedData.socialLinks,
        basePriceCents: validatedData.basePriceCents,
        profileImage: validatedData.profileImage || null,
        portfolio: validatedData.portfolio || [],
      },
    });

    // Update user role to DJ
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: "DJ" },
    });

    return NextResponse.json({ ok: true, djProfile }, { status: 201 });
  } catch (error) {
    console.error("DJ registration error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.issues[0]?.message || "Invalid input",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
