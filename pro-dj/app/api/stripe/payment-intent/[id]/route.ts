import { NextRequest, NextResponse } from "next/server";
import { stripe, handleStripeError } from "@/lib/stripe-config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendMail } from "@/lib/email";

// GET: Retrieve payment intent details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const paymentIntentId = params.id;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Verify user has access to this payment
    const booking = await prisma.booking.findFirst({
      where: {
        stripePaymentIntentId: paymentIntentId,
        OR: [
          { userId: session.user.id }, // Customer
          { dj: { userId: session.user.id } }, // DJ
        ],
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Payment not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        created: paymentIntent.created,
        description: paymentIntent.description,
        receipt_email: paymentIntent.receipt_email,
        metadata: paymentIntent.metadata,
      },
    });
  } catch (error) {
    console.error("Error retrieving payment intent:", error);

    if (error instanceof Error && error.name === "StripeError") {
      return NextResponse.json(
        { error: error.message },
        { status: (error as any).statusCode || 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to retrieve payment details" },
      { status: 500 }
    );
  }
}

// POST: Process refund
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const paymentIntentId = params.id;
    const { amount, reason } = await req.json();

    // Verify user has permission to refund (admin or DJ)
    const booking = await prisma.booking.findFirst({
      where: {
        stripePaymentIntentId: paymentIntentId,
        OR: [
          { dj: { userId: session.user.id } }, // DJ
          { user: { role: "ADMIN" } }, // Admin
        ],
      },
      include: {
        user: true,
        dj: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Payment not found or refund permission denied" },
        { status: 404 }
      );
    }

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Full refund if no amount specified
      reason: reason || "requested_by_customer",
      metadata: {
        refundedBy: session.user.id,
        bookingId: booking.id,
        refundReason: reason || "requested_by_customer",
      },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "REFUNDED",
        refundedAt: new Date(),
        refundAmount: amount || booking.amount,
        refundReason: reason || "requested_by_customer",
      },
    });

    // Send refund notification emails
    if (booking.user?.email) {
      await sendMail(
        booking.user.email,
        "Refund Processed - Pro-DJ Booking",
        `Your refund of $${
          amount || booking.amount
        } has been processed. Reason: ${reason || "requested_by_customer"}`
      );
    }

    return NextResponse.json({
      refund: {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
      },
    });
  } catch (error) {
    console.error("Error processing refund:", error);

    if (error instanceof Error && error.name === "StripeError") {
      return NextResponse.json(
        { error: error.message },
        { status: (error as any).statusCode || 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process refund" },
      { status: 500 }
    );
  }
}
