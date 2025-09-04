import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// GET - Fetch admin booking queue (bookings pending review)
export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "PENDING_ADMIN_REVIEW";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get bookings in the admin queue
    const bookings = await prisma.booking.findMany({
      where: {
        status: status as any,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        preferredDj: {
          select: {
            id: true,
            stageName: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
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
        adminActions: {
          include: {
            admin: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: [{ eventDate: "asc" }, { createdAt: "asc" }],
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.booking.count({
      where: {
        status: status as any,
      },
    });

    return NextResponse.json({
      success: true,
      bookings: bookings.map((booking) => ({
        id: booking.id,
        eventType: booking.eventType,
        eventDate: booking.eventDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        quotedPriceCents: booking.quotedPriceCents,
        message: booking.message,
        details: booking.details,
        selectedAddons: booking.selectedAddons,
        status: booking.status,
        createdAt: booking.createdAt,
        client: booking.user,
        preferredDj: booking.preferredDj,
        servicePricing: booking.proDjServicePricing,
        adminActions: booking.adminActions,
        // Calculate priority score for sorting
        priorityScore: calculateBookingPriority(booking),
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching admin booking queue:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking queue" },
      { status: 500 }
    );
  }
}

// Helper function to calculate booking priority
function calculateBookingPriority(booking: any): number {
  let score = 0;

  // Days until event (higher urgency = higher score)
  const daysUntilEvent = Math.max(
    0,
    Math.ceil(
      (new Date(booking.eventDate).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    )
  );

  if (daysUntilEvent <= 7) score += 50; // Very urgent
  else if (daysUntilEvent <= 14) score += 30; // Urgent
  else if (daysUntilEvent <= 30) score += 10; // Normal

  // Event value (higher value = higher priority)
  const valueTiers = booking.quotedPriceCents || 0;
  if (valueTiers >= 200000) score += 30; // $2000+
  else if (valueTiers >= 100000) score += 20; // $1000+
  else if (valueTiers >= 50000) score += 10; // $500+

  // Has preferred DJ (might be easier to process)
  if (booking.preferredDjId) score += 5;

  // How long it's been waiting
  const hoursWaiting = Math.max(
    0,
    Math.ceil(
      (Date.now() - new Date(booking.createdAt).getTime()) / (1000 * 60 * 60)
    )
  );

  if (hoursWaiting >= 48) score += 20; // Waiting 2+ days
  else if (hoursWaiting >= 24) score += 10; // Waiting 1+ day
  else if (hoursWaiting >= 12) score += 5; // Waiting 12+ hours

  return score;
}
