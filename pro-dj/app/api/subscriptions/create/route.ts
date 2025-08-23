import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe-config";
import { SubscriptionTier, SubscriptionStatus } from "@/app/generated/prisma";
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

    const body = await request.json();
    const { planType = SubscriptionTier.DJ_BASIC, returnUrl } = body;

    // Check if user already has a subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: "User already has a subscription" },
        { status: 400 }
      );
    }

    // For development, create a temporary subscription immediately
    // This will be updated by the webhook when it arrives
    if (process.env.NODE_ENV === "development") {
      const tempSubscription = await prisma.subscription.create({
        data: {
          userId: session.user.id,
          stripeSubscriptionId: `temp_${Date.now()}`,
          stripeCustomerId: `temp_cus_${Date.now()}`,
          stripePriceId: "temp_price",
          planType: planType,
          status: SubscriptionStatus.TRIAL,
          amountCents: 500,
          currency: "usd",
          interval: "month",
          intervalCount: 1,
          isInTrial: true,
          trialStart: new Date(),
          trialEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          platformFeePercentage: 10,
        },
      });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { djProfile: true },
    });

    if (!user || !user.djProfile) {
      return NextResponse.json(
        { error: "User must have a DJ profile to subscribe" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.djProfile.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || user.djProfile.stageName,
        metadata: {
          userId: user.id,
          stageName: user.djProfile.stageName,
        },
      });

      stripeCustomerId = customer.id;

      // Update DJ profile with Stripe customer ID
      await prisma.djProfile.update({
        where: { userId: session.user.id },
        data: { stripeCustomerId: customer.id },
      });
    }

    // Get the price ID for the plan
    let priceId;
    switch (planType) {
      case SubscriptionTier.DJ_BASIC:
        priceId = process.env.STRIPE_DJ_BASIC_PRICE_ID?.replace(/"/g, "");
        break;
      case SubscriptionTier.DJ_PRO:
        priceId = process.env.STRIPE_DJ_PRO_PRICE_ID?.replace(/"/g, "");
        break;
      case SubscriptionTier.DJ_PREMIUM:
        priceId = process.env.STRIPE_DJ_PREMIUM_PRICE_ID?.replace(/"/g, "");
        break;
      default:
        throw new Error(`Unknown plan type: ${planType}`);
    }

    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID not configured for this plan" },
        { status: 500 }
      );
    }

    // Create a checkout session for subscription
    const session_result = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 30, // First month free
        metadata: {
          userId: user.id,
          planType,
        },
      },
      success_url: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }${returnUrl || "/dashboard/bookings"}?success=true`,
      cancel_url: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }${returnUrl || "/dashboard/bookings"}?canceled=true`,
      metadata: {
        userId: user.id,
        planType,
      },
    });

    return NextResponse.json({
      ok: true,
      sessionId: session_result.id,
      url: session_result.url,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}
