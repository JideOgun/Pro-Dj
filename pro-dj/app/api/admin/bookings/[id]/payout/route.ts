import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
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

// POST - Process manual payout to DJ
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gate = await requireAdmin();
  if (!gate.ok)
    return NextResponse.json({ ok: false, error: gate.error }, { status: 400 });

  if (!stripe) {
    return NextResponse.json(
      { ok: false, error: "Payment processing not configured" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { payoutAmountCents, payoutPercentage, adminNotes } = body;

  try {
    // Get booking with all related details
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        dj: {
          select: {
            id: true,
            stageName: true,
            stripeConnectAccountId: true,
            stripeConnectAccountEnabled: true,
            user: { select: { name: true, email: true } },
            contractorStatus: true,
            platformSplitPercentage: true,
            contractorSplitPercentage: true,
          },
        },
        proDjServicePricing: {
          select: {
            eventType: true,
            basePricePerHour: true,
            regionMultiplier: true,
            minimumHours: true,
          },
        },
        proDjAddons: {
          select: {
            id: true,
            name: true,
            priceFixed: true,
            pricePerHour: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { ok: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    if (!booking.dj) {
      return NextResponse.json(
        { ok: false, error: "No DJ assigned to this booking" },
        { status: 400 }
      );
    }

    if (booking.status !== "CONFIRMED" && booking.status !== "COMPLETED") {
      return NextResponse.json(
        {
          ok: false,
          error: "Booking must be confirmed or completed to process payout",
        },
        { status: 400 }
      );
    }

    if (!booking.isPaid) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Client must have paid the full amount before processing DJ payout",
        },
        { status: 400 }
      );
    }

    // Check if the event date has passed
    const eventDate = new Date(booking.eventDate);
    const now = new Date();
    if (eventDate > now) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Event must be completed (event date must have passed) before processing DJ payout",
        },
        { status: 400 }
      );
    }

    if (booking.payoutStatus === "COMPLETED") {
      return NextResponse.json(
        { ok: false, error: "Payout already completed for this booking" },
        { status: 400 }
      );
    }

    // Check if DJ has Stripe Connect account
    if (
      !booking.dj.stripeConnectAccountId ||
      !booking.dj.stripeConnectAccountEnabled
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "DJ must have Stripe Connect account set up to receive payouts",
        },
        { status: 400 }
      );
    }

    // Calculate payout amount if not provided
    let finalPayoutAmount = payoutAmountCents;
    let usedPercentage = booking.dj.contractorSplitPercentage?.toNumber() || 30;

    if (!finalPayoutAmount) {
      // Use custom percentage if provided, otherwise use DJ's default
      if (payoutPercentage) {
        usedPercentage = payoutPercentage;
      }
      finalPayoutAmount = Math.round(
        booking.quotedPriceCents * (usedPercentage / 100)
      );
    } else if (payoutPercentage) {
      // If both amount and percentage provided, use percentage for calculation
      usedPercentage = payoutPercentage;
      finalPayoutAmount = Math.round(
        booking.quotedPriceCents * (usedPercentage / 100)
      );
    }

    // Validate payout amount
    if (finalPayoutAmount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid payout amount" },
        { status: 400 }
      );
    }

    if (finalPayoutAmount > booking.quotedPriceCents) {
      return NextResponse.json(
        { ok: false, error: "Payout amount cannot exceed booking total" },
        { status: 400 }
      );
    }

    // Create Stripe transfer to DJ
    let transferId: string;
    try {
      const transfer = await stripe.transfers.create({
        amount: finalPayoutAmount,
        currency: "usd",
        destination: booking.dj.stripeConnectAccountId,
        metadata: {
          bookingId: booking.id,
          djId: booking.dj.id,
          djName: booking.dj.stageName || booking.dj.user.name,
          clientName: booking.user?.name || booking.user?.email || "Unknown",
          eventType: booking.eventType,
          eventDate: booking.eventDate.toISOString(),
          totalBookingAmount: booking.quotedPriceCents.toString(),
          adminNotes: adminNotes || "",
        },
      });

      transferId = transfer.id;
      console.log(
        `✅ Stripe transfer created: ${transferId} for booking ${booking.id}`
      );
    } catch (stripeError: any) {
      console.error("❌ Stripe transfer failed:", stripeError);
      return NextResponse.json(
        {
          ok: false,
          error: `Failed to create Stripe transfer: ${stripeError.message}`,
        },
        { status: 500 }
      );
    }

    // Update booking with payout information
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        payoutStatus: "COMPLETED",
        payoutAmountCents: finalPayoutAmount,
        payoutAt: new Date(),
        payoutId: transferId,
        adminNotes: adminNotes || booking.adminNotes,
      },
    });

    // Create admin action record
    await prisma.adminBookingAction.create({
      data: {
        bookingId: booking.id,
        adminId: gate.session?.user.id || "system",
        action: "PAYOUT_PROCESSED",
        reason: `Manual payout of $${(finalPayoutAmount / 100).toFixed(
          2
        )} (${usedPercentage}%) processed to DJ ${
          booking.dj.stageName || booking.dj.user.name
        }`,
        metadata: {
          payoutAmountCents: finalPayoutAmount,
          payoutPercentage: usedPercentage,
          transferId: transferId,
          adminNotes: adminNotes || "",
        },
      },
    });

    // Send notification to DJ
    await prisma.notification.create({
      data: {
        userId: booking.dj.userId,
        type: "PAYOUT_RECEIVED",
        title: "Payout Received",
        message: `You've received a payout of $${(
          finalPayoutAmount / 100
        ).toFixed(2)} for your ${
          booking.eventType
        } booking on ${booking.eventDate.toLocaleDateString()}.`,
        data: {
          bookingId: booking.id,
          payoutAmountCents: finalPayoutAmount,
          transferId: transferId,
          eventType: booking.eventType,
          eventDate: booking.eventDate,
          clientName: booking.user?.name || booking.user?.email,
        },
        actionUrl: `/dashboard/bookings/${booking.id}`,
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Successfully processed payout of $${(
        finalPayoutAmount / 100
      ).toFixed(2)} (${usedPercentage}%) to DJ ${
        booking.dj.stageName || booking.dj.user.name
      }`,
      data: {
        bookingId: booking.id,
        djName: booking.dj.stageName || booking.dj.user.name,
        payoutAmountCents: finalPayoutAmount,
        payoutAmountFormatted: `$${(finalPayoutAmount / 100).toFixed(2)}`,
        payoutPercentage: usedPercentage,
        transferId: transferId,
        payoutAt: updatedBooking.payoutAt,
        bookingDetails: {
          eventType: booking.eventType,
          eventDate: booking.eventDate,
          clientName: booking.user?.name || booking.user?.email,
          totalAmount: booking.quotedPriceCents,
          addons: booking.proDjAddons.map((addon) => ({
            name: addon.name,
            priceFixed: addon.priceFixed,
            pricePerHour: addon.pricePerHour,
          })),
        },
      },
    });
  } catch (error) {
    console.error("Error processing payout:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to process payout" },
      { status: 500 }
    );
  }
}

// GET - Get payout information for a booking
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gate = await requireAdmin();
  if (!gate.ok)
    return NextResponse.json({ ok: false, error: gate.error }, { status: 400 });

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        dj: {
          select: {
            id: true,
            stageName: true,
            stripeConnectAccountId: true,
            stripeConnectAccountEnabled: true,
            user: { select: { name: true, email: true } },
            contractorStatus: true,
            platformSplitPercentage: true,
            contractorSplitPercentage: true,
          },
        },
        proDjServicePricing: {
          select: {
            eventType: true,
            basePricePerHour: true,
            regionMultiplier: true,
            minimumHours: true,
          },
        },
        proDjAddons: {
          select: {
            id: true,
            name: true,
            priceFixed: true,
            pricePerHour: true,
          },
        },
        adminActions: {
          where: { action: "PAYOUT_PROCESSED" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { ok: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Calculate suggested payout amount
    let suggestedPayoutAmount = 0;
    if (booking.dj) {
      const contractorSplit = booking.dj.contractorSplitPercentage || 30;
      suggestedPayoutAmount = Math.round(
        booking.quotedPriceCents * (contractorSplit.toNumber() / 100)
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        bookingId: booking.id,
        status: booking.status,
        payoutStatus: booking.payoutStatus,
        payoutAmountCents: booking.payoutAmountCents,
        payoutAt: booking.payoutAt,
        payoutId: booking.payoutId,
        suggestedPayoutAmount,
        canProcessPayout:
          (booking.status === "CONFIRMED" || booking.status === "COMPLETED") &&
          booking.isPaid &&
          new Date(booking.eventDate) < new Date(),
        dj: booking.dj
          ? {
              id: booking.dj.id,
              name: booking.dj.stageName || booking.dj.user.name,
              email: booking.dj.user.email,
              hasStripeConnect: !!(
                booking.dj.stripeConnectAccountId &&
                booking.dj.stripeConnectAccountEnabled
              ),
              contractorStatus: booking.dj.contractorStatus,
              splitPercentage:
                booking.dj.contractorSplitPercentage?.toNumber() || 30,
            }
          : null,
        client: {
          name: booking.user?.name || booking.user?.email,
          email: booking.user?.email,
        },
        eventDetails: {
          type: booking.eventType,
          date: booking.eventDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          totalAmount: booking.quotedPriceCents,
          addons: booking.proDjAddons.map((addon) => ({
            name: addon.name,
            priceFixed: addon.priceFixed,
            pricePerHour: addon.pricePerHour,
            priceFormatted: addon.priceFixed
              ? `$${(addon.priceFixed / 100).toFixed(2)}`
              : addon.pricePerHour
              ? `$${(addon.pricePerHour / 100).toFixed(2)}/hr`
              : "Price varies",
          })),
        },
        lastPayoutAction: booking.adminActions[0] || null,
      },
    });
  } catch (error) {
    console.error("Error fetching payout information:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch payout information" },
      { status: 500 }
    );
  }
}
