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

    // Cancel the subscription (change status to CANCELLED)
    const updatedSubscription = await prisma.subscription.update({
      where: { id: currentSubscription.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: "Debug testing - cancelled for upload counter testing",
      },
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
      message: "Subscription cancelled successfully",
      cancelledSubscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        planType: updatedSubscription.planType,
        cancelledAt: updatedSubscription.cancelledAt,
      },
      user: {
        id: session.user.id,
        email: session.user.email,
        freeUploadsUsed: 0,
        maxFreeUploads: 2,
      },
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      {
        error: "Failed to cancel subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
