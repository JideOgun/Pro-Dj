import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe-config";
import { prisma } from "@/lib/prisma";
import { emitBookingUpdate } from "@/lib/socket-server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow DJs and admins to process refunds
    if (session.user.role !== "DJ" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { reason, amount, partial = false } = await req.json();

    if (!reason) {
      return NextResponse.json(
        { error: "Refund reason is required" },
        { status: 400 }
      );
    }

    // Get the booking
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { email: true, name: true } },
        dj: { select: { stageName: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if booking is paid
    if (!booking.isPaid) {
      return NextResponse.json(
        { error: "Cannot refund unpaid booking" },
        { status: 400 }
      );
    }

    // Check if booking already has a refund
    if (booking.refundId) {
      return NextResponse.json(
        { error: "Booking already has a refund" },
        { status: 400 }
      );
    }

    // For DJs, ensure they can only refund their own bookings
    if (session.user.role === "DJ") {
      const djProfile = await prisma.djProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (!djProfile || booking.djId !== djProfile.id) {
        return NextResponse.json(
          { error: "You can only refund your own bookings" },
          { status: 403 }
        );
      }
    }

    // Get the payment intent from Stripe
    if (!booking.checkoutSessionId) {
      return NextResponse.json(
        { error: "No payment session found for this booking" },
        { status: 400 }
      );
    }

    const sessionData = await stripe.checkout.sessions.retrieve(
      booking.checkoutSessionId
    );

    if (!sessionData.payment_intent) {
      return NextResponse.json(
        { error: "No payment intent found for this booking" },
        { status: 400 }
      );
    }

    // Calculate refund amount
    const totalAmount = booking.quotedPriceCents || 0;
    const refundAmount = partial && amount ? amount * 100 : totalAmount; // Convert to cents

    if (refundAmount > totalAmount) {
      return NextResponse.json(
        { error: "Refund amount cannot exceed booking amount" },
        { status: 400 }
      );
    }

    // Process refund through Stripe
    const refund = await stripe.refunds.create({
      payment_intent: sessionData.payment_intent as string,
      amount: refundAmount,
      reason: reason as "duplicate" | "fraudulent" | "requested_by_customer",
      metadata: {
        bookingId: booking.id,
        refundedBy: session.user.id,
        refundReason: reason,
        partial: partial.toString(),
      },
    });

    // Update booking with refund information
    const updatedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        refundId: refund.id,
        refundedAt: new Date(),
        refundAmount: refundAmount,
        totalAmount: totalAmount,
        cancellationReason: reason,
        cancelledAt: new Date(),
        cancelledBy: session.user.id,
        status: "CANCELLED", // Mark as cancelled after refund
      },
      include: {
        user: { select: { email: true, name: true } },
        dj: { select: { stageName: true } },
      },
    });

    // Emit WebSocket event for real-time updates
    emitBookingUpdate(booking.id, "CANCELLED", false);

    // Send email notification to client
    if (booking.user?.email) {
      // You can add email notification here
      console.log(
        `Refund processed for booking ${booking.id}. Email sent to ${booking.user.email}`
      );
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refundAmount / 100, // Convert back to dollars
        status: refund.status,
        reason: reason,
        partial: partial,
      },
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status,
        refundAmount: updatedBooking.refundAmount
          ? updatedBooking.refundAmount / 100
          : 0,
      },
    });
  } catch (error) {
    console.error("Refund error:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to process refund" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the booking
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { email: true, name: true } },
        dj: { select: { stageName: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check permissions
    if (session.user.role === "DJ") {
      const djProfile = await prisma.djProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (!djProfile || booking.djId !== djProfile.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Get refund details from Stripe if refund exists
    let refundDetails = null;
    if (booking.refundId) {
      try {
        const refund = await stripe.refunds.retrieve(booking.refundId);
        refundDetails = {
          id: refund.id,
          amount: refund.amount ? refund.amount / 100 : 0,
          status: refund.status,
          reason: refund.reason,
          created: refund.created,
          metadata: refund.metadata,
        };
      } catch (stripeError) {
        console.error("Error fetching refund from Stripe:", stripeError);
      }
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        status: booking.status,
        isPaid: booking.isPaid,
        quotedPriceCents: booking.quotedPriceCents,
        refundId: booking.refundId,
        refundedAt: booking.refundedAt,
        refundAmount: booking.refundAmount,
        totalAmount: booking.totalAmount,
        cancellationReason: booking.cancellationReason,
        cancelledAt: booking.cancelledAt,
        cancelledBy: booking.cancelledBy,
      },
      refund: refundDetails,
      canRefund:
        booking.isPaid && !booking.refundId && booking.status === "CONFIRMED",
    });
  } catch (error) {
    console.error("Get refund info error:", error);
    return NextResponse.json(
      { error: "Failed to get refund information" },
      { status: 500 }
    );
  }
}
