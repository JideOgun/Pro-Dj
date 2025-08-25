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

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Find and delete temporary trial subscriptions created during development
    const deletedTrials = await prisma.subscription.deleteMany({
      where: {
        OR: [
          {
            stripeSubscriptionId: {
              startsWith: "temp_",
            },
          },
          {
            stripeCustomerId: {
              startsWith: "temp_cus_",
            },
          },
          {
            stripePriceId: "temp_price",
          },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedTrials.count} development trial subscriptions`,
      deletedCount: deletedTrials.count,
    });
  } catch (error) {
    console.error("Error cleaning up trial subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to cleanup trial subscriptions" },
      { status: 500 }
    );
  }
}
