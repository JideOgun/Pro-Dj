import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "This endpoint is only available in development" },
        { status: 403 }
      );
    }

    // Get current subscription
    const currentSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentSubscription) {
      return NextResponse.json(
        { error: "No subscription found for this user" },
        { status: 404 }
      );
    }

    // Delete related records first
    await prisma.promoCodeRedemption.deleteMany({
      where: { subscriptionId: currentSubscription.id },
    });

    await prisma.subscriptionUsage.deleteMany({
      where: { subscriptionId: currentSubscription.id },
    });

    // Delete the subscription
    await prisma.subscription.delete({
      where: { id: currentSubscription.id },
    });

    // Reset user's free upload count
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        freeUploadsUsed: 0,
        maxFreeUploads: 2,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription removed successfully",
      removedSubscription: {
        id: currentSubscription.id,
        status: currentSubscription.status,
        planType: currentSubscription.planType,
      },
      user: {
        id: session.user.id,
        email: session.user.email,
        freeUploadsUsed: 0,
        maxFreeUploads: 2,
      },
    });
  } catch (error) {
    console.error("Error removing subscription:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to remove subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
