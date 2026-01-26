import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/email";
import { paymentConfirmationEmailHtml, djConfirmedHtml } from "@/lib/email-templates";
import { emitBookingUpdate } from "@/lib/socket-server";
import { stripe, webhookConfig, handleStripeError } from "@/lib/stripe-config";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    console.error("Stripe webhook: Missing signature header");
    return NextResponse.json(
      { ok: false, error: "Missing signature" },
      { status: 400 },
    );
  }

  const buf = await req.arrayBuffer();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(buf),
      sig,
      webhookConfig.endpointSecret,
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", errorMessage);
    return NextResponse.json(
      { ok: false, error: `Webhook Error: ${errorMessage}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent,
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
  session: Stripe.Checkout.Session,
) {
  const bookingId = session.metadata?.bookingId;

  if (bookingId) {
    try {
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: "CONFIRMED",
          isPaid: true,
          paidAt: new Date(),
          checkoutSessionId: session.id,
        },
        include: {
          user: { select: { email: true, name: true } },
          dj: { select: { stageName: true } },
          proDjServicePricing: { select: { eventType: true, minimumHours: true } },
          proDjAddons: { select: { name: true, priceFixed: true, pricePerHour: true } },
        },
      });

      // Emit WebSocket event for real-time updates
      emitBookingUpdate(booking.id, "CONFIRMED", true);

      // Send confirmation emails
      try {
        await sendConfirmationEmails(booking, session);
      } catch (emailError) {
        console.error("Error sending confirmation emails:", emailError);
        // Don't throw - we don't want email failures to fail the webhook
      }
    } catch (error) {
      console.error("Error updating booking in webhook:", error);
      throw error;
    }
  } else {
    console.warn("Stripe webhook: No booking ID found in session metadata");
  }
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
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
          status: "CANCELLED",
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
          `Your payment for booking ${bookingId} has failed. Please try again or contact support.`,
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
            2,
          )} has been processed for booking ${bookingId}.`,
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
    id: string;
    details: unknown;
    user?: { email?: string; name?: string | null };
    eventType: string;
    eventDate: Date;
    startTime: Date | null;
    endTime: Date | null;
    quotedPriceCents: number;
    message?: string | null;
    dj?: { stageName: string | null } | null;
    proDjServicePricing?: { minimumHours: number | null } | null;
    proDjAddons?: Array<{ name: string; priceFixed: number | null; pricePerHour: number | null }>;
  },
  session: Stripe.Checkout.Session,
) {
  // Send comprehensive email to client
  // Priority: 1) contactEmail from booking form, 2) user account email
  const bookingFormEmail = (booking.details as Record<string, unknown>)?.contactEmail as string | undefined;
  const userAccountEmail = booking.user?.email;
  
  const clientEmail = bookingFormEmail || userAccountEmail || "";
  const clientName = booking.user?.name || "Valued Client";
  
  if (!clientEmail) {
    console.error("No email address found for booking:", booking.id);
    return;
  }

  try {
    const emailResult = await sendMail(
      clientEmail,
      "Payment received — booking confirmed 🎉",
      paymentConfirmationEmailHtml({
        bookingId: booking.id,
        clientName,
        eventType: booking.eventType,
        eventDate: booking.eventDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        quotedPriceCents: booking.quotedPriceCents,
        djName: booking.dj?.stageName || null,
        minimumHours: booking.proDjServicePricing?.minimumHours || null,
        addons: booking.proDjAddons || [],
        details: (booking.details as Record<string, unknown>) || {},
        message: booking.message || null,
      }),
    );
    
    if (!emailResult.ok) {
      console.error("Failed to send payment confirmation email:", emailResult.error);
    }
  } catch (error) {
    console.error("Exception while sending payment confirmation email:", error);
  }

  // Send email to DJ
  const djEmail = process.env.DJ_NOTIFY_EMAIL || "";
  if (djEmail) {
    try {
      await sendMail(
        djEmail,
        "New confirmed booking",
        djConfirmedHtml({
          eventType: booking.eventType,
          eventDateISO: booking.eventDate.toISOString().slice(0, 10),
          clientEmail,
        }),
      );
      console.log("✅ DJ notification email sent to:", djEmail);
    } catch (error) {
      console.error("❌ Error sending DJ notification email:", error);
    }
  }
}
