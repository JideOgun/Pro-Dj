import { stripe } from "./stripe-config";
import { prisma } from "@/lib/prisma";
import { SubscriptionTier, SubscriptionStatus } from "../app/generated/prisma";

export class SubscriptionService {
  // Create a new subscription for a DJ
  static async createSubscription(
    userId: string,
    planType: SubscriptionTier = SubscriptionTier.DJ_BASIC
  ) {
    try {
      if (!prisma) {
        throw new Error(
          "Prisma client is not initialized in createSubscription"
        );
      }

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { djProfile: true },
      });

      if (!user || !user.djProfile) {
        throw new Error("User must have a DJ profile to subscribe");
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
          where: { userId },
          data: { stripeCustomerId: customer.id },
        });
      }

      // Get the price ID for the plan
      const priceId = await this.getPriceIdForPlan(planType);

      // Create a checkout session for subscription
      const session = await stripe.checkout.sessions.create({
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
        }/dashboard/dj?success=true`,
        cancel_url: `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/dashboard/dj?canceled=true`,
        metadata: {
          userId: user.id,
          planType,
        },
      });

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }
  }

  // Get subscription details
  static async getSubscription(userId: string) {
    console.log("prisma object:", prisma);

    if (!prisma) {
      throw new Error("Prisma client is not initialized");
    }

    return await prisma.subscription.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            djProfile: {
              select: {
                stageName: true,
              },
            },
          },
        },
        usage: {
          where: { isCurrentPeriod: true },
          orderBy: { periodStart: "desc" },
          take: 1,
        },
      },
    });
  }

  // Cancel subscription
  static async cancelSubscription(userId: string, reason?: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new Error("No subscription found");
    }

    // Cancel in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update in database
    return await prisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: true,
        cancelReason: reason,
        cancelledAt: new Date(),
      },
    });
  }

  // Reactivate subscription
  static async reactivateSubscription(userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new Error("No subscription found");
    }

    // Reactivate in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    // Update in database
    return await prisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: false,
        cancelReason: null,
        cancelledAt: null,
      },
    });
  }

  // Update subscription plan
  static async updateSubscriptionPlan(
    userId: string,
    newPlanType: SubscriptionTier
  ) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new Error("No subscription found");
    }

    const newPriceId = await this.getPriceIdForPlan(newPlanType);

    // Update in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [
        {
          id: subscription.stripePriceId,
          price: newPriceId,
        },
      ],
      proration_behavior: "create_prorations",
    });

    // Update in database
    return await prisma.subscription.update({
      where: { userId },
      data: {
        planType: newPlanType,
        stripePriceId: newPriceId,
      },
    });
  }

  // Get price ID for plan type
  private static async getPriceIdForPlan(
    planType: SubscriptionTier
  ): Promise<string> {
    // For now, we'll use environment variables for price IDs
    // In production, you'd want to store these in the database
    switch (planType) {
      case SubscriptionTier.DJ_BASIC:
        return process.env.STRIPE_DJ_BASIC_PRICE_ID!;
      case SubscriptionTier.DJ_PRO:
        return process.env.STRIPE_DJ_PRO_PRICE_ID!;
      case SubscriptionTier.DJ_PREMIUM:
        return process.env.STRIPE_DJ_PREMIUM_PRICE_ID!;
      default:
        throw new Error(`Unknown plan type: ${planType}`);
    }
  }

  // Check if user has active subscription
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) return false;

    return [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL].includes(
      subscription.status
    );
  }

  // Get subscription usage for current period
  static async getCurrentUsage(subscriptionId: string) {
    return await prisma.subscriptionUsage.findFirst({
      where: {
        subscriptionId,
        isCurrentPeriod: true,
      },
    });
  }

  // Update usage metrics
  static async updateUsage(
    subscriptionId: string,
    bookingAmount: number,
    platformFee: number
  ) {
    const currentUsage = await this.getCurrentUsage(subscriptionId);

    if (currentUsage) {
      // Update existing usage record
      return await prisma.subscriptionUsage.update({
        where: { id: currentUsage.id },
        data: {
          bookingsCount: { increment: 1 },
          revenueGenerated: { increment: bookingAmount },
          platformFeesCollected: { increment: platformFee },
        },
      });
    } else {
      // Create new usage record for current period
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      return await prisma.subscriptionUsage.create({
        data: {
          subscriptionId,
          bookingsCount: 1,
          revenueGenerated: bookingAmount,
          platformFeesCollected: platformFee,
          periodStart,
          periodEnd,
          isCurrentPeriod: true,
        },
      });
    }
  }
}
