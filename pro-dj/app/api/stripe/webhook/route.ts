import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/email";
import { clientConfirmedHtml, djConfirmedHtml } from "@/lib/email-templates";
import { emitBookingUpdate } from "@/lib/socket-server";
import { stripe, webhookConfig, handleStripeError } from "@/lib/stripe-config";

export const runtime = "nodejs";

export async function POST(req: Request) {
  console.log("🔍 Webhook request received");

  const sig = req.headers.get("stripe-signature");
  console.log("📝 Signature header present:", !!sig);

  if (!sig) {
    console.log("❌ Missing signature header");
    return NextResponse.json(
      { ok: false, error: "Missing signature" },
      { status: 400 }
    );
  }

  const buf = await req.arrayBuffer();

  let event: Stripe.Event;
  try {
    console.log("🔐 Attempting to verify webhook signature...");
    console.log(
      "🔑 Webhook secret length:",
      process.env.STRIPE_WEBHOOK_SECRET?.length || 0
    );

    event = stripe.webhooks.constructEvent(
      Buffer.from(buf),
      sig,
      webhookConfig.endpointSecret
    );
    console.log("✅ Webhook signature verified successfully");
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Webhook signature verification failed:", errorMessage);
    return NextResponse.json(
      { ok: false, error: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  console.log("📨 Stripe webhook received:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case "refund.created":
        await handleRefundCreated(event.data.object as Stripe.Refund);
        break;

      case "charge.dispute.created":
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      case "charge.dispute.closed":
        await handleDisputeClosed(event.data.object as Stripe.Dispute);
        break;

      default:
        console.log(`📨 Unhandled webhook event type: ${event.type}`);
    }
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    // Don't return an error response to Stripe - they'll retry
    return NextResponse.json({ received: true }, { status: 200 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  console.log("🔄 Stripe webhook: checkout.session.completed received");
  const bookingId = session.metadata?.bookingId;
  console.log("📋 Booking ID from metadata:", bookingId);

  if (bookingId) {
    try {
      console.log("🔄 Updating booking status to CONFIRMED...");
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: "CONFIRMED",
          isPaid: true,
          paidAt: new Date(),
          checkoutSessionId: session.id,
        },
        include: { user: { select: { email: true, name: true } } },
      });
      console.log(
        "✅ Booking updated successfully:",
        booking.id,
        booking.status
      );

      // Emit WebSocket event for real-time updates
      console.log("📡 Emitting WebSocket event for booking:", booking.id);
      emitBookingUpdate(booking.id, "CONFIRMED", true);

      // Send confirmation emails
      await sendConfirmationEmails(booking, session);
    } catch (error) {
      console.error("❌ Error updating booking:", error);
      throw error;
    }
  } else {
    console.log("⚠️ No booking ID found in session metadata");
  }
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  console.log("🔄 Payment intent succeeded:", paymentIntent.id);
  // Additional payment success handling if needed
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log("❌ Payment intent failed:", paymentIntent.id);

  const bookingId = paymentIntent.metadata?.bookingId;
  if (bookingId) {
    try {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: "DECLINED",
          isPaid: false,
        },
      });

      // Emit WebSocket event
      emitBookingUpdate(bookingId, "PAYMENT_FAILED", false);

      // Send payment failure notification
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { user: { select: { email: true } } },
      });

      if (booking?.user?.email) {
        await sendMail(
          booking.user.email,
          "Payment Failed - Pro-DJ Booking",
          `Your payment for booking ${bookingId} has failed. Please try again or contact support.`
        );
      }
    } catch (error) {
      console.error("❌ Error handling payment failure:", error);
    }
  }
}

async function handleRefundCreated(refund: Stripe.Refund) {
  console.log("🔄 Refund created:", refund.id);

  const bookingId = refund.metadata?.bookingId;
  if (bookingId) {
    try {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          refundId: refund.id,
          refundedAt: new Date(),
          status: "CANCELLED",
        },
      });

      // Emit WebSocket event
      emitBookingUpdate(bookingId, "REFUNDED", false);

      // Send refund confirmation email
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { user: { select: { email: true } } },
      });

      if (booking?.user?.email) {
        await sendMail(
          booking.user.email,
          "Refund Processed - Pro-DJ Booking",
          `Your refund of $${(refund.amount / 100).toFixed(
            2
          )} has been processed for booking ${bookingId}.`
        );
      }
    } catch (error) {
      console.error("❌ Error handling refund:", error);
    }
  }
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  console.log("⚠️ Dispute created:", dispute.id);

  // Log dispute for manual review
  console.log("Dispute details:", {
    id: dispute.id,
    amount: dispute.amount,
    reason: dispute.reason,
    status: dispute.status,
    evidence: dispute.evidence,
  });

  // You might want to send notifications to admin team
  // and update booking status to indicate dispute
}

async function handleDisputeClosed(dispute: Stripe.Dispute) {
  console.log("✅ Dispute closed:", dispute.id, "Status:", dispute.status);

  // Handle dispute resolution
  if (dispute.status === "won") {
    console.log("✅ Dispute won in your favor");
  } else if (dispute.status === "lost") {
    console.log("❌ Dispute lost - refund may be required");
  }
}

async function sendConfirmationEmails(
  booking: {
    details: unknown;
    user?: { email?: string };
    eventType: string;
    eventDate: Date;
  },
  session: Stripe.Checkout.Session
) {
  // Send email to client
  const clientEmail =
    ((booking.details as Record<string, unknown>)?.contactEmail as string) ||
    booking.user?.email ||
    "";
  if (clientEmail) {
    await sendMail(
      clientEmail,
      "Payment received — booking confirmed 🎉",
      clientConfirmedHtml({
        eventType: booking.eventType,
        eventDateISO: booking.eventDate.toISOString().slice(0, 10),
      })
    );
  }

  // Send email to DJ
  const djEmail = process.env.DJ_NOTIFY_EMAIL || "";
  if (djEmail) {
    await sendMail(
      djEmail,
      "New confirmed booking",
      djConfirmedHtml({
        eventType: booking.eventType,
        eventDateISO: booking.eventDate.toISOString().slice(0, 10),
        clientEmail,
      })
    );
  }
}
