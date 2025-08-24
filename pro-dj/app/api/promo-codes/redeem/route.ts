import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Valid promo codes (in production, these would be stored in the database)
const VALID_PROMO_CODES = {
  "myguy2025": {
    name: "My Guy 2025",
    description: "Special promo code for DJ friends",
    grantsSubscription: true,
    subscriptionType: "DJ_BASIC",
    duration: "1 year", // 1 year of free access
  }
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { promoCode } = await request.json();

    if (!promoCode) {
      return NextResponse.json(
        { error: "Promo code is required" },
        { status: 400 }
      );
    }

    // Check if promo code is valid
    const promoCodeData = VALID_PROMO_CODES[promoCode as keyof typeof VALID_PROMO_CODES];
    
    if (!promoCodeData) {
      return NextResponse.json(
        { error: "Invalid promo code" },
        { status: 400 }
      );
    }

    // Check if user already has a subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: "You already have an active subscription" },
        { status: 400 }
      );
    }

    // Check if user already redeemed this promo code
    const existingPromoRedemption = await prisma.promoCodeRedemption.findUnique({
      where: {
        userId_promoCode: {
          userId: session.user.id,
          promoCode: promoCode
        }
      }
    });

    if (existingPromoRedemption) {
      return NextResponse.json(
        { error: "You have already redeemed this promo code" },
        { status: 400 }
      );
    }

    // Calculate expiration date (1 year from now)
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);

    // Create subscription for the user
    const subscription = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        planType: promoCodeData.subscriptionType,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: expirationDate,
        amountCents: 0, // Free
        currency: "usd",
        isInTrial: false,
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: `promo_${promoCode}_${Date.now()}`,
        stripeCustomerId: `promo_customer_${session.user.id}`,
      }
    });

    // Record the promo code redemption
    await prisma.promoCodeRedemption.create({
      data: {
        userId: session.user.id,
        promoCode: promoCode,
        redeemedAt: new Date(),
        subscriptionId: subscription.id,
      }
    });

    return NextResponse.json({
      success: true,
      message: `Promo code redeemed successfully! You now have ${promoCodeData.duration} of free access.`,
      subscription: {
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      }
    });

  } catch (error) {
    console.error("Error redeeming promo code:", error);
    return NextResponse.json(
      { error: "Failed to redeem promo code" },
      { status: 500 }
    );
  }
}
