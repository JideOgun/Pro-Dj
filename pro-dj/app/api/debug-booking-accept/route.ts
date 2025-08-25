import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();

    console.log("🔍 Debugging booking acceptance for:", bookingId);

    // Check environment variables
    const envCheck = {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "SET" : "NOT_SET",
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY
        ? "SET"
        : "NOT_SET",
      APP_URL: process.env.APP_URL,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    };

    console.log("Environment check:", envCheck);

    // Test Stripe initialization
    let stripe: Stripe | null = null;
    let stripeError = null;

    try {
      if (process.env.STRIPE_SECRET_KEY) {
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: "2025-07-30.basil",
        });
        console.log("✅ Stripe initialized successfully");
      } else {
        console.log("❌ STRIPE_SECRET_KEY not set");
      }
    } catch (error) {
      stripeError = error instanceof Error ? error.message : "Unknown error";
      console.log("❌ Stripe initialization failed:", stripeError);
    }

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { email: true, name: true } },
        dj: { select: { stageName: true } },
      },
    });

    if (!booking) {
      console.log("❌ Booking not found");
      return NextResponse.json(
        {
          success: false,
          error: "Booking not found",
          step: "booking_lookup",
        },
        { status: 404 }
      );
    }

    console.log("✅ Booking found:", {
      id: booking.id,
      status: booking.status,
      eventType: booking.eventType,
      quotedPriceCents: booking.quotedPriceCents,
      hasUser: !!booking.user,
      hasDj: !!booking.dj,
    });

    // Check if booking has quoted price
    if (!booking.quotedPriceCents) {
      console.log("❌ No quoted price on booking");
      return NextResponse.json(
        {
          success: false,
          error: "No quote on booking",
          step: "price_check",
        },
        { status: 400 }
      );
    }

    // Test Stripe checkout session creation
    let checkoutSession = null;
    let checkoutError = null;

    if (stripe) {
      try {
        checkoutSession = await stripe.checkout.sessions.create({
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
          },
          success_url: `${
            process.env.APP_URL || process.env.NEXTAUTH_URL
          }/book/success?bid=${booking.id}`,
          cancel_url: `${
            process.env.APP_URL || process.env.NEXTAUTH_URL
          }/book/cancel?bid=${booking.id}`,
        });
        console.log("✅ Stripe checkout session created:", checkoutSession.id);
      } catch (error) {
        checkoutError =
          error instanceof Error ? error.message : "Unknown error";
        console.log(
          "❌ Stripe checkout session creation failed:",
          checkoutError
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Booking acceptance debug completed",
      envCheck,
      stripe: {
        initialized: !!stripe,
        error: stripeError,
      },
      booking: {
        id: booking.id,
        status: booking.status,
        eventType: booking.eventType,
        quotedPriceCents: booking.quotedPriceCents,
        hasUser: !!booking.user,
        hasDj: !!booking.dj,
      },
      checkout: {
        created: !!checkoutSession,
        sessionId: checkoutSession?.id,
        error: checkoutError,
      },
    });
  } catch (error) {
    console.error("❌ Error in booking acceptance debug:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        step: "exception",
      },
      { status: 500 }
    );
  }
}
