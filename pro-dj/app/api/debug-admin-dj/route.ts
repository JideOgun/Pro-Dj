import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateAdminDjProfile } from "@/lib/admin-dj-utils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "No authenticated user" },
        { status: 401 }
      );
    }

    console.log("Testing admin DJ profile creation for user:", session.user.email);

    // Check user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, role: true },
    });

    console.log("User details:", user);

    if (!user) {
      return NextResponse.json({
        ok: false,
        error: "User not found in database",
        userId: session.user.id,
      }, { status: 404 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({
        ok: false,
        error: "User is not an admin",
        userRole: user.role,
      }, { status: 403 });
    }

    // Check if DJ profile already exists
    const existingProfile = await prisma.djProfile.findFirst({
      where: { userId: user.id },
    });

    console.log("Existing DJ profile:", existingProfile);

    if (existingProfile) {
      return NextResponse.json({
        ok: true,
        message: "DJ profile already exists",
        profile: {
          id: existingProfile.id,
          stageName: existingProfile.stageName,
          isApprovedByAdmin: existingProfile.isApprovedByAdmin,
        },
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    }

    // Try to create DJ profile
    try {
      const djProfile = await getOrCreateAdminDjProfile(user.id);
      
      return NextResponse.json({
        ok: true,
        message: "DJ profile created successfully",
        profile: {
          id: djProfile.id,
          stageName: djProfile.stageName,
          isApprovedByAdmin: djProfile.isApprovedByAdmin,
        },
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (createError) {
      console.error("Error creating DJ profile:", createError);
      
      return NextResponse.json({
        ok: false,
        error: "Failed to create DJ profile",
        details: createError instanceof Error ? createError.message : "Unknown error",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Debug admin DJ error:", error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
