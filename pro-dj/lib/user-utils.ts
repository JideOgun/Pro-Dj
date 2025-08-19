import { prisma } from "@/lib/prisma";

export interface UserWithProfile {
  id: string;
  name: string | null;
  email: string;
  role: string;
  djProfile?: {
    stageName: string;
  } | null;
}

/**
 * Get the proper display name for a user
 * For DJs, prioritizes stage name over regular name
 * For others, uses name or email fallback
 */
export async function getDisplayName(userId: string): Promise<string> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        djProfile: {
          select: { stageName: true },
        },
      },
    });

    if (!user) {
      return "Unknown User";
    }

    // For DJs, prioritize stage name
    if (user.role === "DJ" && user.djProfile?.stageName) {
      return user.djProfile.stageName;
    }

    // For admins who are also DJs, use stage name if available
    if (user.role === "ADMIN" && user.djProfile?.stageName) {
      return user.djProfile.stageName;
    }

    // Fallback to name or email
    return user.name || user.email.split("@")[0] || "User";
  } catch (error) {
    console.error("Error getting display name:", error);
    return "User";
  }
}

/**
 * Get display name from existing user object (no database query)
 */
export function getDisplayNameFromUser(user: UserWithProfile): string {
  // For DJs, prioritize stage name
  if (user.role === "DJ" && user.djProfile?.stageName) {
    return user.djProfile.stageName;
  }

  // For admins who are also DJs, use stage name if available
  if (user.role === "ADMIN" && user.djProfile?.stageName) {
    return user.djProfile.stageName;
  }

  // Fallback to name or email
  return user.name || user.email.split("@")[0] || "User";
}
