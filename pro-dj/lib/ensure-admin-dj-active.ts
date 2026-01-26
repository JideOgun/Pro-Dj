import { prisma } from "@/lib/prisma";

/**
 * Utility function to ensure all admin DJ profiles are set to ACTIVE
 * This can be called on app startup or as a maintenance task
 */
export async function ensureAllAdminDjsAreActive() {
  try {
    // Find all admin users with DJ profiles
    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      include: { djProfile: true },
    });

    const updates = await Promise.all(
      adminUsers
        .filter((user) => user.djProfile)
        .map(async (user) => {
          if (user.status !== "ACTIVE") {
            await prisma.user.update({
              where: { id: user.id },
              data: { status: "ACTIVE" },
            });
            return user;
          }
          return null;
        })
    );

    const updatedCount = updates.filter((u) => u !== null).length;

    return { updated: updatedCount, total: adminUsers.filter((u) => u.djProfile).length };
  } catch (error) {
    console.error("Error ensuring admin DJs are active:", error);
    throw error;
  }
}
