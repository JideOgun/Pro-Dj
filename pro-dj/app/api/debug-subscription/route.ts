import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSubscriptionStatus } from "@/lib/subscription-guards";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        freeUploadsUsed: true,
        maxFreeUploads: true,
        subscription: {
          select: {
            id: true,
            status: true,
            planType: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            isInTrial: true,
            trialEnd: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get subscription status using the same logic as the subscription guard
    const subscriptionStatus = await getSubscriptionStatus(session.user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        freeUploadsUsed: user.freeUploadsUsed,
        maxFreeUploads: user.maxFreeUploads,
      },
      subscription: user.subscription,
      subscriptionStatus: subscriptionStatus,
      debug: {
        hasActiveSubscription: subscriptionStatus.hasActiveSubscription,
        canAccessFeature: subscriptionStatus.canAccessFeature,
        freeUploadsRemaining: subscriptionStatus.freeUploadsRemaining,
        message: subscriptionStatus.message,
      },
    });
  } catch (error) {
    console.error("Error in debug subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription debug info" },
      { status: 500 }
    );
  }
}
