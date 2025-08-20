import { NextRequest, NextResponse } from "next/server";
import { stripe, businessConfig, handleStripeError } from "@/lib/stripe-config";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Verify user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { bookingId, amount, eventDetails } = await req.json();

    // Validate required fields
    if (!bookingId || !amount || !eventDetails) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: session.user.id,
        status: "PENDING", // Only allow payment for pending bookings
      },
      include: {
        dj: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found or already paid" },
        { status: 404 }
      );
    }

    // Calculate amount in cents
    const amountInCents = Math.round(amount * 100);

    // Create professional checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      // Success and cancel URLs
      success_url: `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/booking/cancel?session_id={CHECKOUT_SESSION_ID}`,

      // Professional metadata
      metadata: {
        bookingId,
        eventType: eventDetails.type,
        eventDate: eventDetails.date,
        djId: booking.djId || "",
        userId: session.user.id,
        customerEmail: session.user.email || "",
      },

      // Line items with proper descriptions
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${eventDetails.type} DJ Services`,
              description: `Professional DJ services for ${eventDetails.type} on ${eventDetails.date}`,
              images: [
                process.env.NEXT_PUBLIC_BASE_URL
                  ? `${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`
                  : "https://via.placeholder.com/400x400/6366f1/ffffff?text=Pro-DJ",
              ],
              metadata: {
                eventType: eventDetails.type,
                eventDate: eventDetails.date,
                djName: booking.dj?.stageName || "Professional DJ",
              },
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],

      // Customer information
      customer_email: session.user.email || undefined,

      // Business information
      billing_address_collection: "required",
      tax_id_collection: {
        enabled: true,
      },

      // Payment settings
      payment_intent_data: {
        metadata: {
          bookingId,
          eventType: eventDetails.type,
          djId: booking.djId || "",
        },
        receipt_email: session.user.email || undefined,
        description: `${eventDetails.type} DJ Services - ${eventDetails.date}`,
      },

      // Professional settings
      allow_promotion_codes: true,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes

      // Business branding
      submit_type: "pay",
      locale: "en",

      // Custom fields for better UX
      custom_fields: [
        {
          key: "event_notes",
          label: {
            type: "custom",
            custom: "Event Notes (Optional)",
          },
          type: "text",
          optional: true,
        },
      ],

      // Shipping address collection (if needed for events)
      shipping_address_collection: {
        allowed_countries: ["US", "CA"], // Add more countries as needed
      },
    });

    // Update booking with Stripe session ID
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        stripeSessionId: checkoutSession.id,
        status: "PAYMENT_PENDING",
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);

    if (error instanceof Error && error.name === "StripeError") {
      return NextResponse.json(
        { error: error.message },
        { status: (error as any).statusCode || 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
