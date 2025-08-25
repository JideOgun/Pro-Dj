import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@/app/generated/prisma";

export interface SubscriptionGuardResult {
  hasActiveSubscription: boolean;
  subscription?: any;
  isInTrial: boolean;
  trialDaysRemaining?: number;
  canAccessFeature: boolean;
  freeUploadsRemaining: number;
  message?: string;
}

/**
 * Check if a user has an active subscription
 */
export async function checkSubscriptionStatus(
  userId: string
): Promise<SubscriptionGuardResult> {
  try {
    // Get user with free upload tracking
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        freeUploadsUsed: true,
        maxFreeUploads: true,
      },
    });

    if (!user) {
      return {
        hasActiveSubscription: false,
        canAccessFeature: false,
        isInTrial: false,
        freeUploadsRemaining: 0,
        message: "User not found",
      };
    }

    // Admin users always have access
    if (user.role === "ADMIN") {
      return {
        hasActiveSubscription: true,
        canAccessFeature: true,
        isInTrial: false,
        freeUploadsRemaining: 999, // Unlimited for admins
        message: "Admin access - all features available",
      };
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    const freeUploadsRemaining = Math.max(
      0,
      user.maxFreeUploads - user.freeUploadsUsed
    );

    if (!subscription) {
      const result = {
        hasActiveSubscription: false,
        canAccessFeature: freeUploadsRemaining > 0,
        isInTrial: false,
        freeUploadsRemaining,
        message:
          freeUploadsRemaining > 0
            ? `${freeUploadsRemaining} free upload${
                freeUploadsRemaining === 1 ? "" : "s"
              } remaining`
            : "No free uploads remaining - subscription required",
      };

      return result;
    }

    const isActive =
      subscription.status === "ACTIVE" ||
      subscription.status === "TRIAL";

    const isInTrial = subscription.status === "TRIAL";

    // If subscription is cancelled, treat as if no subscription exists
    if (subscription.status === "CANCELLED") {
      return {
        hasActiveSubscription: false,
        canAccessFeature: freeUploadsRemaining > 0,
        isInTrial: false,
        freeUploadsRemaining,
        message:
          freeUploadsRemaining > 0
            ? `${freeUploadsRemaining} free upload${
                freeUploadsRemaining === 1 ? "" : "s"
              } remaining`
            : "No free uploads remaining - subscription required",
      };
    }

    let trialDaysRemaining: number | undefined;
    if (isInTrial && subscription.trialEnd) {
      const now = new Date();
      const trialEnd = new Date(subscription.trialEnd);
      const diffTime = trialEnd.getTime() - now.getTime();
      trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      hasActiveSubscription: isActive,
      subscription,
      isInTrial,
      trialDaysRemaining,
      canAccessFeature: isActive || freeUploadsRemaining > 0,
      freeUploadsRemaining: isActive ? 999 : freeUploadsRemaining, // Unlimited for subscribers
      message: isInTrial
        ? `Trial active (${trialDaysRemaining} days remaining)`
        : isActive
        ? "Active subscription"
        : freeUploadsRemaining > 0
        ? `${freeUploadsRemaining} free upload${
            freeUploadsRemaining === 1 ? "" : "s"
          } remaining`
        : "No free uploads remaining - subscription required",
    };
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return {
      hasActiveSubscription: false,
      canAccessFeature: false,
      isInTrial: false,
      freeUploadsRemaining: 0,
      message: "Error checking subscription status",
    };
  }
}

/**
 * Server-side guard for API routes
 */
export async function requireActiveSubscription() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  const subscriptionStatus = await checkSubscriptionStatus(session.user.id);

  if (!subscriptionStatus.canAccessFeature) {
    throw new Error(
      subscriptionStatus.message || "Active subscription required"
    );
  }

  return subscriptionStatus;
}

/**
 * Check if user can access specific features
 */
export async function canAccessFeature(
  userId: string,
  feature: string
): Promise<boolean> {
  const subscriptionStatus = await checkSubscriptionStatus(userId);

  if (!subscriptionStatus.canAccessFeature) {
    return false;
  }

  // Add feature-specific checks here if needed
  switch (feature) {
    case "bookings":
    case "media_uploads":
    case "mixes":
    case "videos":
    case "photos":
    case "advanced_profile":
      return subscriptionStatus.canAccessFeature;
    default:
      return true; // Allow access to basic features
  }
}

/**
 * Get subscription status for client-side use
 */
export async function getSubscriptionStatus(userId: string) {
  return await checkSubscriptionStatus(userId);
}
