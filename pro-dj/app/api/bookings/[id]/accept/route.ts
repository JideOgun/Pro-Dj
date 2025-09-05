import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import Stripe from "stripe";
import { sendMail } from "@/lib/email";
import { acceptEmailHtml } from "@/lib/email-templates";
import { isDjAvailable } from "@/lib/booking-utils";

// Initialize Stripe only if secret key is available
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gate = await requireAdmin();
  if (!gate.ok)
    return NextResponse.json({ ok: false, error: gate.error }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const djId = body.djId ? String(body.djId).trim() : null;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, name: true } },
      dj: { select: { stageName: true } },
    },
  });
  if (!booking)
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 }
    );

  // Only admins can accept bookings in the Pro-DJ model
  // DJs are subcontractors and don't directly accept bookings
  if (!booking.quotedPriceCents)
    return NextResponse.json(
      { ok: false, error: "No quote on booking" },
      { status: 400 }
    );

  // If DJ is being assigned, check for conflicts
  if (djId && booking.startTime && booking.endTime) {
    const { available, conflictingBookings } = await isDjAvailable(
      djId,
      booking.startTime,
      booking.endTime,
      booking.id // Exclude current booking from conflict check
    );

    if (!available) {
      return NextResponse.json(
        {
          ok: false,
          error: "Selected DJ is not available for this time slot",
          conflictingBookings: (
            conflictingBookings as Array<{
              id: string;
              startTime: Date;
              endTime: Date;
              eventType: string;
              user?: { name?: string; email?: string };
            }>
          ).map((b) => ({
            id: b.id,
            startTime: b.startTime,
            endTime: b.endTime,
            eventType: b.eventType,
            clientName: b.user?.name || b.user?.email,
          })),
        },
        { status: 409 }
      );
    }
  }

  // Check if Stripe is configured
  if (!stripe) {
    return NextResponse.json(
      { ok: false, error: "Payment processing not configured" },
      { status: 500 }
    );
  }

  // Get DJ details for subcontractor model (all DJs are now subcontractors)
  let platformFeeCents: number;
  let djPayoutCents: number;

  if (djId) {
    const djProfile = await prisma.djProfile.findUnique({
      where: { id: djId },
      select: {
        stripeConnectAccountId: true,
        stripeConnectAccountEnabled: true,
        contractorType: true,
        contractorStatus: true,
        platformSplitPercentage: true,
        contractorSplitPercentage: true,
      },
    });

    if (!djProfile) {
      return NextResponse.json(
        { ok: false, error: "DJ not found" },
        { status: 404 }
      );
    }

    // All DJs are subcontractors: 70% Pro-DJ, 30% subcontractor
    const platformSplit = djProfile.platformSplitPercentage || 70; // Default 70%
    const contractorSplit = djProfile.contractorSplitPercentage || 30; // Default 30%

    platformFeeCents = Math.round(
      booking.quotedPriceCents * (platformSplit.toNumber() / 100)
    );
    djPayoutCents = Math.round(
      booking.quotedPriceCents * (contractorSplit.toNumber() / 100)
    );

    // Note: Stripe Connect is no longer required for booking acceptance
    // Pro-DJ will collect 100% of payment and disburse to DJ later
  } else {
    // Default rates: 100% Pro-DJ, 0% DJ (Pro-DJ will disburse later)
    platformFeeCents = booking.quotedPriceCents; // Pro-DJ gets 100%
    djPayoutCents = 0; // DJ gets 0% initially
  }

  // Update: Pro-DJ now collects 100% of payment, no immediate DJ payout
  platformFeeCents = booking.quotedPriceCents;
  djPayoutCents = 0;

  // Create a Checkout Session for the quoted amount with application fee
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: booking.user?.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${booking.eventType} - Package`,
            description: `Event on ${booking.eventDate
              .toISOString()
              .slice(0, 10)}`,
          },
          unit_amount: booking.quotedPriceCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      bookingId: booking.id,
      userId: booking.userId,
      djId: djId || "",
      platformFeeCents: platformFeeCents.toString(),
      djPayoutCents: djPayoutCents.toString(),
      isSubcontractor: "true", // All DJs are now subcontractors
    },
    // No payment_intent_data needed - Pro-DJ collects 100% of payment
    // DJs will be paid later through manual disbursement
    success_url: `${process.env.APP_URL}/book/success?bid=${booking.id}`,
    cancel_url: `${process.env.APP_URL}/book/cancel?bid=${booking.id}`,
    // optional: expires_at to limit how long they can pay
  });

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "CONFIRMED", // Booking is confirmed and payment session created
      checkoutSessionId: session.id,
      platformFeeCents: platformFeeCents,
      payoutAmountCents: djPayoutCents,
      escrowStatus: "PENDING",
      adminAssignedDjId: djId, // Track which DJ the admin assigned
      adminApprovedAt: new Date(),
      adminApprovedBy: gate.session?.user.id,
      ...(djId && { djId }), // Assign DJ if provided
    },
  });

  //send email with session.url to client (below)
  // ...after creating `session` and updating booking to CONFIRMED:
  const payLink = session.url ?? null;

  const clientEmail =
    ((booking.details as Record<string, unknown>)?.contactEmail as string) || // prefer typed-in email
    booking.user?.email || // fallback to account email
    "";

  // Email the client (soft-fail if not configured)
  if (clientEmail && payLink) {
    await sendMail(
      clientEmail,
      "Your Pro-DJ booking has been approved — complete payment",
      acceptEmailHtml({
        name: booking.user?.name,
        eventType: booking.eventType,
        eventDateISO: booking.eventDate.toISOString().slice(0, 10),
        payLink,
      })
    );
  }

  return NextResponse.json(
    { ok: true, data: updated, checkoutUrl: session.url },
    { status: 200 }
  );
}
