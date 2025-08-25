import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// Initialize Stripe
let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-07-30.basil",
    });
  }
} catch (error) {
  console.error("Failed to initialize Stripe:", error);
  stripe = null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { resolution, refundAmountCents, adminNotes } = await request.json();
    // resolution: "refund_client", "pay_dj", "partial_refund", "split"
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        dj: { select: { id: true, userId: true, stageName: true, stripeConnectAccountId: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.disputeStatus !== "OPEN") {
      return NextResponse.json(
        { error: "Booking is not in dispute" },
        { status: 400 }
      );
    }

    let updateData: any = {
      disputeStatus: "RESOLVED",
      disputeResolvedAt: new Date(),
    };

    // Handle different resolution types
    switch (resolution) {
      case "refund_client":
        // Full refund to client
        if (booking.checkoutSessionId) {
          try {
            const session = await stripe.checkout.sessions.retrieve(booking.checkoutSessionId);
            if (session.payment_intent) {
              await stripe.refunds.create({
                payment_intent: session.payment_intent as string,
                amount: booking.quotedPriceCents,
              });
            }
          } catch (error) {
            console.error("Error creating refund:", error);
          }
        }
        
        updateData.escrowStatus = "REFUNDED";
        updateData.refundAmountCents = booking.quotedPriceCents;
        updateData.refundedAt = new Date();
        break;

      case "pay_dj":
        // Pay DJ the full amount (minus platform fee)
        updateData.escrowStatus = "RELEASED";
        updateData.payoutStatus = "COMPLETED";
        updateData.payoutAt = new Date();
        break;

      case "partial_refund":
        // Partial refund to client, rest to DJ
        if (!refundAmountCents || refundAmountCents >= booking.quotedPriceCents) {
          return NextResponse.json(
            { error: "Invalid refund amount" },
            { status: 400 }
          );
        }

        if (booking.checkoutSessionId) {
          try {
            const session = await stripe.checkout.sessions.retrieve(booking.checkoutSessionId);
            if (session.payment_intent) {
              await stripe.refunds.create({
                payment_intent: session.payment_intent as string,
                amount: refundAmountCents,
              });
            }
          } catch (error) {
            console.error("Error creating partial refund:", error);
          }
        }

        const djAmount = booking.quotedPriceCents - refundAmountCents;
        updateData.escrowStatus = "RELEASED";
        updateData.refundAmountCents = refundAmountCents;
        updateData.refundedAt = new Date();
        updateData.payoutAmountCents = djAmount;
        updateData.payoutStatus = "COMPLETED";
        updateData.payoutAt = new Date();
        break;

      case "split":
        // Split the amount between client and DJ
        const splitAmount = Math.round(booking.quotedPriceCents / 2);
        
        if (booking.checkoutSessionId) {
          try {
            const session = await stripe.checkout.sessions.retrieve(booking.checkoutSessionId);
            if (session.payment_intent) {
              await stripe.refunds.create({
                payment_intent: session.payment_intent as string,
                amount: splitAmount,
              });
            }
          } catch (error) {
            console.error("Error creating split refund:", error);
          }
        }

        updateData.escrowStatus = "RELEASED";
        updateData.refundAmountCents = splitAmount;
        updateData.refundedAt = new Date();
        updateData.payoutAmountCents = splitAmount;
        updateData.payoutStatus = "COMPLETED";
        updateData.payoutAt = new Date();
        break;

      default:
        return NextResponse.json(
          { error: "Invalid resolution type" },
          { status: 400 }
        );
    }

    // Update booking with resolution
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Dispute resolved: ${resolution}`,
      booking: {
        id: updatedBooking.id,
        disputeStatus: updatedBooking.disputeStatus,
        escrowStatus: updatedBooking.escrowStatus,
        refundAmountCents: updatedBooking.refundAmountCents,
        payoutAmountCents: updatedBooking.payoutAmountCents,
      },
    });
  } catch (error) {
    console.error("Error resolving dispute:", error);
    return NextResponse.json(
      { error: "Failed to resolve dispute" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get booking with dispute details
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        dj: { select: { id: true, userId: true, stageName: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        disputeStatus: booking.disputeStatus,
        disputeReason: booking.disputeReason,
        disputeCreatedAt: booking.disputeCreatedAt,
        escrowStatus: booking.escrowStatus,
        quotedPriceCents: booking.quotedPriceCents,
        platformFeeCents: booking.platformFeeCents,
        payoutAmountCents: booking.payoutAmountCents,
        client: booking.user,
        dj: booking.dj,
      },
    });
  } catch (error) {
    console.error("Error getting dispute details:", error);
    return NextResponse.json(
      { error: "Failed to get dispute details" },
      { status: 500 }
    );
  }
}
