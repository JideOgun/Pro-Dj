import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe-config";
import { SubscriptionTier, SubscriptionStatus } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = rateLimit(rateLimitConfigs.subscription)(request);
  if (rateLimitResult) return rateLimitResult;

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

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (
      existingSubscription &&
      (existingSubscription.status === "ACTIVE" ||
        existingSubscription.status === "TRIAL")
    ) {
      return NextResponse.json(
        { error: "User already has a subscription" },
        { status: 400 }
      );
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
      default:
        priceId = process.env.STRIPE_DJ_BASIC_PRICE_ID?.replace(/"/g, "");
    }

    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID not configured" },
        { status: 500 }
      );
    }

    // Create Stripe checkout session
    const session_url = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const success_url = returnUrl
      ? `${session_url}${returnUrl}?success=true`
      : `${session_url}/dashboard/dj?success=true`;
    const cancel_url = returnUrl
      ? `${session_url}${returnUrl}?canceled=true`
      : `${session_url}/dashboard/dj?canceled=true`;

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: success_url,
      cancel_url: cancel_url,
      metadata: {
        userId: session.user.id,
        planType: planType,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          planType: planType,
        },
      },
    });

    return NextResponse.json({
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}
