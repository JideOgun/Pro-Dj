import { prisma } from "@/lib/prisma";

/**
 * Ensures an admin user has a DJ profile, creating one if it doesn't exist
 */
export async function ensureAdminDjProfile(userId: string) {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true, email: true },
    });

    if (!user || user.role !== "ADMIN") {
      throw new Error("User is not an admin");
    }

    // Check if DJ profile already exists
    const existingProfile = await prisma.djProfile.findFirst({
      where: { userId },
    });

    if (existingProfile) {
      return existingProfile;
    }

    // Create DJ profile for admin
    const djProfile = await prisma.djProfile.create({
      data: {
        userId: userId,
        stageName: user.name || "Admin DJ",
        bio: "Admin DJ profile with full access to all features",
        basePriceCents: 5000, // $50
        isApprovedByAdmin: true, // Auto-approve admin
        isAvailableForBookings: true,
        acceptsBookings: true,
        maxFreeUploads: 999999, // Unlimited for admin
        isFeatured: false,
        status: "ACTIVE",
      },
    });

    console.log(`Created DJ profile for admin user: ${user.email}`);
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
    const djProfile = await prisma.djProfile.findFirst({
      where: { userId },
    });

    if (djProfile) {
      return djProfile;
    }

    // If no profile exists, ensure one is created (for admin users)
    return await ensureAdminDjProfile(userId);
  } catch (error) {
    console.error("Error getting/creating admin DJ profile:", error);
    throw error;
  }
}
