import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe-config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get DJ profile for DJ users
    let djProfile = null;
    if (session.user.role === "DJ") {
      djProfile = await prisma.djProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (!djProfile) {
        return NextResponse.json(
          { error: "DJ profile not found" },
          { status: 404 }
        );
      }
    }

    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json({
        hasData: false,
        message: "Payment processing not configured yet",
        analytics: null
      });
    }

    // Get date range for analytics (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Get Stripe payment intents for the period
    const paymentIntents = await stripe.paymentIntents.list({
      created: {
        gte: Math.floor(startDate.getTime() / 1000),
        lte: Math.floor(endDate.getTime() / 1000),
      },
      limit: 100,
    });

    // Get Stripe charges for the period
    const charges = await stripe.charges.list({
      created: {
        gte: Math.floor(startDate.getTime() / 1000),
        lte: Math.floor(endDate.getTime() / 1000),
      },
      limit: 100,
    });

    // Get Stripe refunds for the period
    const refunds = await stripe.refunds.list({
      created: {
        gte: Math.floor(startDate.getTime() / 1000),
        lte: Math.floor(endDate.getTime() / 1000),
      },
      limit: 100,
    });

    // Filter bookings for the DJ if applicable
    let bookingFilter = {};
    if (djProfile) {
      bookingFilter = { djId: djProfile.id };
    }

    // Get bookings for the period
    const bookings = await prisma.booking.findMany({
      where: {
        ...bookingFilter,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: { select: { name: true, email: true } },
        dj: { select: { stageName: true } },
      },
    });

    // Check if there's any payment data
    if (paymentIntents.data.length === 0 && bookings.length === 0) {
      return NextResponse.json({
        hasData: false,
        message: "No payment data available yet. Start accepting bookings to see your analytics!",
        analytics: null
      });
    }

    // Calculate payment analytics
    const totalPayments = paymentIntents.data.length;
    const successfulPayments = paymentIntents.data.filter(
      (pi) => pi.status === "succeeded"
    ).length;
    const failedPayments = paymentIntents.data.filter(
      (pi) =>
        pi.status === "canceled" || pi.status === "requires_payment_method"
    ).length;
    const pendingPayments = paymentIntents.data.filter(
      (pi) =>
        pi.status === "processing" || pi.status === "requires_confirmation"
    ).length;

    const successRate =
      totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

    // Calculate total amounts
    const totalAmount = paymentIntents.data
      .filter((pi) => pi.status === "succeeded")
      .reduce((sum, pi) => sum + (pi.amount || 0), 0);

    const totalRefunded = refunds.data.reduce(
      (sum, refund) => sum + (refund.amount || 0),
      0
    );

    // Payment method breakdown
    const paymentMethods = charges.data.reduce((acc, charge) => {
      const method = charge.payment_method_details?.type || "unknown";
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Daily payment trends
    const dailyPayments = {};
    paymentIntents.data
      .filter((pi) => pi.status === "succeeded")
      .forEach((pi) => {
        const date = new Date(pi.created * 1000).toISOString().split("T")[0];
        dailyPayments[date] = (dailyPayments[date] || 0) + (pi.amount || 0);
      });

    // Booking conversion analytics
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(
      (b) => b.status === "CONFIRMED"
    ).length;
    const pendingBookings = bookings.filter(
      (b) => b.status === "PENDING_ADMIN_REVIEW"
    ).length;
    const acceptedBookings = bookings.filter(
      (b) => b.status === "DJ_ASSIGNED"
    ).length;
    const declinedBookings = bookings.filter(
      (b) => b.status === "CANCELLED"
    ).length;

    const conversionRate =
      totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;

    // Recent payment activity
    const recentPayments = paymentIntents.data
      .filter((pi) => pi.status === "succeeded")
      .slice(0, 10)
      .map((pi) => ({
        id: pi.id,
        amount: pi.amount ? pi.amount / 100 : 0,
        status: pi.status,
        created: pi.created,
        currency: pi.currency,
        paymentMethod: pi.payment_method_details?.type || "unknown",
      }));

    // Error analysis
    const paymentErrors = paymentIntents.data
      .filter((pi) => pi.last_payment_error)
      .map((pi) => ({
        id: pi.id,
        error: pi.last_payment_error?.message || "Unknown error",
        code: pi.last_payment_error?.code || "unknown",
        created: pi.created,
      }));

    const analytics = {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: 30,
      },
      payments: {
        total: totalPayments,
        successful: successfulPayments,
        failed: failedPayments,
        pending: pendingPayments,
        successRate: Math.round(successRate * 100) / 100,
        totalAmount: totalAmount / 100, // Convert to dollars
        totalRefunded: totalRefunded / 100, // Convert to dollars
        netAmount: (totalAmount - totalRefunded) / 100, // Convert to dollars
      },
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        pending: pendingBookings,
        accepted: acceptedBookings,
        declined: declinedBookings,
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
      paymentMethods,
      dailyPayments,
      recentPayments,
      paymentErrors,
      refunds: {
        total: refunds.data.length,
        totalAmount: totalRefunded / 100,
        recent: refunds.data.slice(0, 5).map((refund) => ({
          id: refund.id,
          amount: refund.amount ? refund.amount / 100 : 0,
          reason: refund.reason || "unknown",
          status: refund.status,
          created: refund.created,
        })),
      },
    };

    return NextResponse.json({
      hasData: true,
      analytics
    });
  } catch (error) {
    console.error("Stripe analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
