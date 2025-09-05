import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// GET - Get all bookings that need payouts or have been paid out
export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok)
    return NextResponse.json({ ok: false, error: gate.error }, { status: 400 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all"; // all, pending, completed
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause based on status filter
    let whereClause: any = {
      dj: { isNot: null }, // Only bookings with assigned DJs
      status: { in: ["CONFIRMED", "COMPLETED"] }, // Only confirmed/completed bookings
      isPaid: true, // Only bookings where client has paid
      eventDate: { lt: new Date() }, // Only bookings where event date has passed
    };

    if (status === "pending") {
      whereClause.payoutStatus = { in: ["PENDING", null] };
    } else if (status === "completed") {
      whereClause.payoutStatus = "COMPLETED";
    }

    // Get bookings with payout information
    const bookings = await prisma.booking.findMany({
      where: whereClause,
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
      orderBy: [
        { payoutStatus: "asc" }, // Pending payouts first
        { eventDate: "desc" },
        { createdAt: "desc" },
      ],
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.booking.count({
      where: whereClause,
    });

    // Process bookings to include calculated payout amounts
    const processedBookings = bookings.map((booking) => {
      // Calculate suggested payout amount
      let suggestedPayoutAmount = 0;
      if (booking.dj) {
        const contractorSplit = booking.dj.contractorSplitPercentage || 30;
        suggestedPayoutAmount = Math.round(
          booking.quotedPriceCents * (contractorSplit.toNumber() / 100)
        );
      }

      // Calculate platform fee
      const platformFee = booking.quotedPriceCents - suggestedPayoutAmount;

      return {
        id: booking.id,
        status: booking.status,
        payoutStatus: booking.payoutStatus || "PENDING",
        payoutAmountCents: booking.payoutAmountCents,
        payoutAt: booking.payoutAt,
        payoutId: booking.payoutId,
        suggestedPayoutAmount,
        platformFee,
        canProcessPayout:
          (booking.status === "CONFIRMED" || booking.status === "COMPLETED") &&
          booking.payoutStatus !== "COMPLETED" &&
          booking.dj?.stripeConnectAccountId &&
          booking.dj?.stripeConnectAccountEnabled,
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
          totalAmountFormatted: `$${(booking.quotedPriceCents / 100).toFixed(
            2
          )}`,
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
        createdAt: booking.createdAt,
      };
    });

    // Calculate summary statistics
    const pendingBookings = processedBookings.filter(
      (b) => b.payoutStatus === "PENDING"
    );
    const completedBookings = processedBookings.filter(
      (b) => b.payoutStatus === "COMPLETED"
    );

    const totalPendingAmount = pendingBookings.reduce(
      (sum, b) => sum + b.suggestedPayoutAmount,
      0
    );
    const totalCompletedAmount = completedBookings.reduce(
      (sum, b) => sum + (b.payoutAmountCents || 0),
      0
    );
    const totalPlatformRevenue = processedBookings.reduce(
      (sum, b) => sum + b.platformFee,
      0
    );

    return NextResponse.json({
      ok: true,
      data: {
        bookings: processedBookings,
        summary: {
          total: totalCount,
          pending: pendingBookings.length,
          completed: completedBookings.length,
          totalPendingAmount,
          totalCompletedAmount,
          totalPlatformRevenue,
          totalPendingAmountFormatted: `$${(totalPendingAmount / 100).toFixed(
            2
          )}`,
          totalCompletedAmountFormatted: `$${(
            totalCompletedAmount / 100
          ).toFixed(2)}`,
          totalPlatformRevenueFormatted: `$${(
            totalPlatformRevenue / 100
          ).toFixed(2)}`,
        },
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching payout data:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch payout data" },
      { status: 500 }
    );
  }
}
