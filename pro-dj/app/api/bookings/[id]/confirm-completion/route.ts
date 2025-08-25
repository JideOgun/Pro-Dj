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
    const { confirmedBy } = await request.json(); // "client" or "dj"
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get booking
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

    // Verify user has permission to confirm
    if (confirmedBy === "client" && booking.user.id !== session.user.id) {
      return NextResponse.json(
        { error: "Only the client can confirm completion" },
        { status: 403 }
      );
    }

    if (confirmedBy === "dj" && booking.dj?.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the DJ can confirm completion" },
        { status: 403 }
      );
    }

    // Check if booking is paid and in escrow
    if (!booking.isPaid || booking.escrowStatus !== "HELD") {
      return NextResponse.json(
        { error: "Booking must be paid and in escrow to confirm completion" },
        { status: 400 }
      );
    }

    // Update confirmation status
    const updateData: any = {};
    if (confirmedBy === "client") {
      updateData.clientConfirmed = true;
    } else if (confirmedBy === "dj") {
      updateData.djConfirmed = true;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, email: true, name: true } },
        dj: { select: { id: true, userId: true, stageName: true } },
      },
    });

    // Check if both parties have confirmed
    if (updatedBooking.clientConfirmed && updatedBooking.djConfirmed) {
      // Both confirmed - release escrow and payout DJ
      await prisma.booking.update({
        where: { id },
        data: {
          escrowStatus: "RELEASED",
          eventCompletedAt: new Date(),
          payoutStatus: "COMPLETED",
          payoutAt: new Date(),
        },
      });

      // Update booking status to completed
      await prisma.booking.update({
        where: { id },
        data: {
          status: "CONFIRMED",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Event completion confirmed by both parties. DJ payout has been released.",
        booking: {
          id: updatedBooking.id,
          escrowStatus: "RELEASED",
          payoutStatus: "COMPLETED",
          payoutAmount: updatedBooking.payoutAmountCents,
        },
      });
    } else {
      // Only one party confirmed
      const remainingParty = updatedBooking.clientConfirmed ? "DJ" : "Client";
      return NextResponse.json({
        success: true,
        message: `Event completion confirmed by ${confirmedBy}. Waiting for ${remainingParty} confirmation.`,
        booking: {
          id: updatedBooking.id,
          clientConfirmed: updatedBooking.clientConfirmed,
          djConfirmed: updatedBooking.djConfirmed,
        },
      });
    }
  } catch (error) {
    console.error("Error confirming event completion:", error);
    return NextResponse.json(
      { error: "Failed to confirm event completion" },
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
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        escrowStatus: true,
        clientConfirmed: true,
        djConfirmed: true,
        eventCompletedAt: true,
        payoutStatus: true,
        payoutAmountCents: true,
        platformFeeCents: true,
        user: { select: { id: true, name: true } },
        dj: { select: { id: true, userId: true, stageName: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this booking
    const isClient = booking.user.id === session.user.id;
    const isDj = booking.dj?.userId === session.user.id;

    if (!isClient && !isDj) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        escrowStatus: booking.escrowStatus,
        clientConfirmed: booking.clientConfirmed,
        djConfirmed: booking.djConfirmed,
        eventCompletedAt: booking.eventCompletedAt,
        payoutStatus: booking.payoutStatus,
        payoutAmountCents: booking.payoutAmountCents,
        platformFeeCents: booking.platformFeeCents,
        canConfirm: isClient ? !booking.clientConfirmed : !booking.djConfirmed,
        userRole: isClient ? "client" : "dj",
      },
    });
  } catch (error) {
    console.error("Error getting booking completion status:", error);
    return NextResponse.json(
      { error: "Failed to get booking completion status" },
      { status: 500 }
    );
  }
}
