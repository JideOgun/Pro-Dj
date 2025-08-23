import { NextRequest, NextResponse } from "next/server";
import { stripe, webhookConfig } from "@/lib/stripe-config";
import { SubscriptionStatus } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookConfig.endpointSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;

      case "customer.subscription.trial_will_end":
        await handleTrialWillEnd(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(subscription: any) {
  try {
    // Check if subscription already exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (existingSubscription) {
      // Update existing subscription
      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status:
            subscription.status === "trialing"
              ? SubscriptionStatus.TRIAL
              : SubscriptionStatus.ACTIVE,
          currentPeriodStart:
            subscription.status === "trialing" && subscription.trial_start
              ? new Date(subscription.trial_start * 1000)
              : subscription.current_period_start
              ? new Date(subscription.current_period_start * 1000)
              : null,
          currentPeriodEnd:
            subscription.status === "trialing" && subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null,
          trialStart: subscription.trial_start
            ? new Date(subscription.trial_start * 1000)
            : null,
          trialEnd: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null,
          isInTrial: subscription.status === "trialing",
        },
      });
    } else {
      console.log(
        "Subscription not found in database, will be created by checkout.session.completed"
      );
    }
  } catch (error) {
    console.error("Error handling subscription created:", error);
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status:
        subscription.status === "trialing"
          ? SubscriptionStatus.TRIAL
          : subscription.status === "active"
          ? SubscriptionStatus.ACTIVE
          : subscription.status === "past_due"
          ? SubscriptionStatus.PAST_DUE
          : subscription.status === "unpaid"
          ? SubscriptionStatus.UNPAID
          : SubscriptionStatus.CANCELLED,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      isInTrial: subscription.status === "trialing",
    },
  });
}

async function handleSubscriptionDeleted(subscription: any) {
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: SubscriptionStatus.CANCELLED,
      cancelledAt: new Date(),
    },
  });
}

async function handlePaymentSucceeded(invoice: any) {
  console.log("Payment succeeded for invoice:", invoice.id);

  if (invoice.subscription) {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: invoice.subscription },
      data: {
        lastPaymentDate: new Date(),
        nextPaymentDate: invoice.next_payment_attempt
          ? new Date(invoice.next_payment_attempt * 1000)
          : null,
      },
    });
  }
}

async function handlePaymentFailed(invoice: any) {
  console.log("Payment failed for invoice:", invoice.id);

  if (invoice.subscription) {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: invoice.subscription },
      data: {
        status: SubscriptionStatus.PAST_DUE,
        nextPaymentDate: invoice.next_payment_attempt
          ? new Date(invoice.next_payment_attempt * 1000)
          : null,
      },
    });
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  console.log("Checkout session completed:", session.id);

  if (session.mode === "subscription" && session.subscription) {
    try {
      // Get the subscription details
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription
      );

      // Validate required fields
      if (!session.metadata?.userId) {
        throw new Error("Missing userId in session metadata");
      }

      // Create subscription record in database
      await prisma.subscription.create({
        data: {
          userId: session.metadata.userId,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          stripePriceId: subscription.items.data[0].price.id,
          planType: session.metadata.planType as any,
          status:
            subscription.status === "trialing"
              ? SubscriptionStatus.TRIAL
              : SubscriptionStatus.ACTIVE,
          currentPeriodStart:
            subscription.status === "trialing" && subscription.trial_start
              ? new Date(subscription.trial_start * 1000)
              : subscription.current_period_start
              ? new Date(subscription.current_period_start * 1000)
              : null,
          currentPeriodEnd:
            subscription.status === "trialing" && subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null,
          amountCents: subscription.items.data[0].price.unit_amount || 500,
          currency: subscription.currency,
          interval:
            subscription.items.data[0].price.recurring?.interval || "month",
          intervalCount:
            subscription.items.data[0].price.recurring?.interval_count || 1,
          trialStart: subscription.trial_start
            ? new Date(subscription.trial_start * 1000)
            : null,
          trialEnd: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null,
          isInTrial: subscription.status === "trialing",
          platformFeePercentage: 10,
        },
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }
  }
}

async function handleTrialWillEnd(subscription: any) {
  // Send notification to user about trial ending
  // You can implement email notifications here
}
