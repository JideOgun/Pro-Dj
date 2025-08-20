import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const djProfileSchema = z.object({
  stageName: z.string().min(1, "Stage name is required").max(100),
  bio: z.string().min(1, "Bio is required").max(1000),
  genres: z.array(z.string()).min(1, "At least one genre is required"),
  customGenres: z.string().max(200).optional(),
  experience: z.number().min(1, "Experience must be at least 1 year").max(50),
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
  basePriceCents: z.number().min(1, "Base rate must be at least $1"),
  eventsOffered: z
    .array(z.string())
    .min(1, "At least one event type is required"),
  profileImage: z.string().optional(),
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

    const body = await req.json();
    console.log("Received DJ registration data:", body);

    const validatedData = djProfileSchema.parse(body);
    console.log("Validated data:", validatedData);

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

    // Check if stage name is already taken (case-insensitive)
    const existingStageName = await prisma.djProfile.findFirst({
      where: {
        stageName: {
          equals: validatedData.stageName,
          mode: "insensitive",
        },
      },
    });

    if (existingStageName) {
      return NextResponse.json(
        {
          ok: false,
          error: `Stage name "${validatedData.stageName}" is already taken. Please choose a different name.`,
        },
        { status: 400 }
      );
    }

    // Create DJ profile and update user profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create DJ profile
      const djProfile = await tx.djProfile.create({
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
          eventsOffered: validatedData.eventsOffered,
          profileImage: validatedData.profileImage || null,
          portfolio: validatedData.portfolio || [],
          isApprovedByAdmin: false, // Require admin approval
        },
      });

      // Update user profile with DJ information
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          role: "DJ",
          status: "PENDING", // Require admin approval
          // Prefill user profile with DJ information
          name: validatedData.stageName, // Use stage name as display name
          location: validatedData.location,
          bio: validatedData.bio,
          profileImage: validatedData.profileImage || null,
          website: validatedData.socialLinks?.website || null,
          socialLinks: {
            instagram: validatedData.socialLinks?.instagram || null,
            twitter: null, // Not in DJ form
            facebook: null, // Not in DJ form
            linkedin: null, // Not in DJ form
            youtube: validatedData.socialLinks?.youtube || null,
            soundcloud: validatedData.socialLinks?.soundcloud || null,
          },
        },
      });

      return { djProfile, updatedUser };
    });

    return NextResponse.json(
      { ok: true, djProfile: result.djProfile },
      { status: 201 }
    );
  } catch (error) {
    console.error("DJ registration error:", error);

    if (error instanceof z.ZodError) {
      console.error("Validation errors:", error.issues);
      const errorMessages = error.issues
        .map((issue) => issue.message)
        .join(", ");
      return NextResponse.json(
        {
          ok: false,
          error: errorMessages || "Invalid input",
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
