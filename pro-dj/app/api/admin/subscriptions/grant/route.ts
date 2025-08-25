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

    const { userId, planType } = await request.json();

    if (!userId || !planType) {
      return NextResponse.json(
        { error: "User ID and plan type are required" },
        { status: 400 }
      );
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        djProfile: true,
        subscription: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is a DJ
    if (user.role !== "DJ") {
      return NextResponse.json(
        { error: "Can only grant subscriptions to DJ users" },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    if (
      user.subscription &&
      (user.subscription.status === "ACTIVE" ||
        user.subscription.status === "TRIAL")
    ) {
      return NextResponse.json(
        { error: "User already has an active subscription" },
        { status: 400 }
      );
    }

    // Calculate expiration date (1 year from now)
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);

    // Create or update subscription
    const subscription = await prisma.subscription.upsert({
      where: {
        userId: userId,
      },
      update: {
        planType: planType,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: expirationDate,
        amountCents: 0, // Free
        currency: "usd",
        isInTrial: false,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        cancelReason: null,
        stripePriceId:
          process.env.STRIPE_DJ_BASIC_PRICE_ID?.replace(/"/g, "") ||
          "admin_granted_price",
      },
      create: {
        userId: userId,
        planType: planType,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: expirationDate,
        amountCents: 0, // Free
        currency: "usd",
        isInTrial: false,
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: `admin_granted_${Date.now()}`,
        stripeCustomerId: `admin_customer_${userId}`,
        stripePriceId:
          process.env.STRIPE_DJ_BASIC_PRICE_ID?.replace(/"/g, "") ||
          "admin_granted_price",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription granted successfully",
      subscription: {
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        stageName: user.djProfile?.stageName,
      },
    });
  } catch (error) {
    console.error("Error granting subscription:", error);
    return NextResponse.json(
      { error: "Failed to grant subscription" },
      { status: 500 }
    );
  }
}
