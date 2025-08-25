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
    const { reason, requestedAction } = await request.json(); // "refund", "partial_refund", "release"
    
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

    // Verify user has permission to dispute
    const isClient = booking.user.id === session.user.id;
    const isDj = booking.dj?.userId === session.user.id;

    if (!isClient && !isDj) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Check if booking is in escrow
    if (booking.escrowStatus !== "HELD") {
      return NextResponse.json(
        { error: "Booking must be in escrow to file a dispute" },
        { status: 400 }
      );
    }

    // Update booking with dispute information
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        disputeStatus: "OPEN",
        disputeReason: reason,
        disputeCreatedAt: new Date(),
        escrowStatus: "DISPUTED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Dispute filed successfully. Admin will review and resolve.",
      booking: {
        id: updatedBooking.id,
        disputeStatus: updatedBooking.disputeStatus,
        escrowStatus: updatedBooking.escrowStatus,
        requestedAction,
      },
    });
  } catch (error) {
    console.error("Error filing dispute:", error);
    return NextResponse.json(
      { error: "Failed to file dispute" },
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
        disputeStatus: true,
        disputeReason: true,
        disputeCreatedAt: true,
        disputeResolvedAt: true,
        escrowStatus: true,
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
        disputeStatus: booking.disputeStatus,
        disputeReason: booking.disputeReason,
        disputeCreatedAt: booking.disputeCreatedAt,
        disputeResolvedAt: booking.disputeResolvedAt,
        escrowStatus: booking.escrowStatus,
        canDispute: booking.disputeStatus === "NONE" && booking.escrowStatus === "HELD",
        userRole: isClient ? "client" : "dj",
      },
    });
  } catch (error) {
    console.error("Error getting dispute status:", error);
    return NextResponse.json(
      { error: "Failed to get dispute status" },
      { status: 500 }
    );
  }
}
