import { prisma } from "@/lib/prisma";

/**
 * Ensures an admin DJ user is always ACTIVE
 * Call this whenever an admin DJ profile is accessed
 */
export async function ensureAdminDjIsActive(djProfileId: string): Promise<void> {
  try {
    const djProfile = await prisma.djProfile.findUnique({
      where: { id: djProfileId },
      include: { user: { select: { role: true, status: true, id: true } } },
    });

    if (djProfile && djProfile.user.role === "ADMIN" && djProfile.user.status !== "ACTIVE") {
      await prisma.user.update({
        where: { id: djProfile.user.id },
        data: { status: "ACTIVE" },
      });
    }
  } catch (error) {
    console.error("Error ensuring admin DJ is active:", error);
    // Don't throw - this is a background maintenance operation
  }
}

/**
 * Ensures an admin user has a DJ profile, creating one if it doesn't exist
 */
export async function ensureAdminDjProfile(userId: string) {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true, email: true, bio: true },
    });

    if (!user || user.role !== "ADMIN") {
      throw new Error("User is not an admin");
    }

    // Check if DJ profile already exists
    const existingProfile = await prisma.djProfile.findFirst({
      where: { userId },
    });

    if (existingProfile) {
      // Ensure admin DJ user is always ACTIVE
      const userWithStatus = await prisma.user.findUnique({
        where: { id: userId },
        select: { status: true },
      });
      if (userWithStatus && userWithStatus.status !== "ACTIVE") {
        await prisma.user.update({
          where: { id: userId },
          data: { status: "ACTIVE" },
        });
      }
      return existingProfile;
    }

    // Check if user has a DJ profile from being a DJ first
    const userAsDj = await prisma.user.findUnique({
      where: { id: userId },
      include: { djProfile: true },
    });

    // If user already has a DJ profile, ensure user is ACTIVE
    if (userAsDj?.djProfile) {
      if (userAsDj.status !== "ACTIVE") {
        await prisma.user.update({
          where: { id: userId },
          data: { status: "ACTIVE" },
        });
      }
      return userAsDj.djProfile;
    }

    // Ensure admin user is ACTIVE before creating DJ profile
    const userWithStatus = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });
    if (userWithStatus && userWithStatus.status !== "ACTIVE") {
      await prisma.user.update({
        where: { id: userId },
        data: { status: "ACTIVE" },
      });
    }

    // Create DJ profile for admin using only user data, no hardcoded defaults
    const djProfile = await prisma.djProfile.create({
      data: {
        userId: userId,
        stageName: user.name || "Admin DJ", // Use real name as stage name
        bio: user.bio, // Optional field, can be null
        experience: 0, // Required field, minimal value
        isApprovedByAdmin: true, // Auto-approve admin
        isAcceptingBookings: true,
        isFeatured: false,
      },
    });

    return djProfile;
  } catch (error) {
    console.error("Error ensuring admin DJ profile:", error);
    throw error;
  }
}

/**
 * Gets or creates a DJ profile for admin users
 */
export async function getOrCreateAdminDjProfile(userId: string) {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      throw new Error("User is not an admin");
    }

    const djProfile = await prisma.djProfile.findFirst({
      where: { userId },
    });

    if (djProfile) {
      // Ensure admin DJ user is always ACTIVE
      const userWithStatus = await prisma.user.findUnique({
        where: { id: userId },
        select: { status: true },
      });
      if (userWithStatus && userWithStatus.status !== "ACTIVE") {
        await prisma.user.update({
          where: { id: userId },
          data: { status: "ACTIVE" },
        });
      }
      return djProfile;
    }

    // If no profile exists, ensure one is created (for admin users)
    return await ensureAdminDjProfile(userId);
  } catch (error) {
    console.error("Error getting/creating admin DJ profile:", error);
    throw error;
  }
}
