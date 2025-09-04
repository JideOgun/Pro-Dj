import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { isDjAvailable } from "@/lib/booking-utils";

// GET - Get DJ suggestions for a specific booking
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  try {
    const { id: bookingId } = params;

    // Get the booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        preferredDj: {
          select: {
            id: true,
            stageName: true,
            contractorStatus: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Get all active subcontractor DJs
    const allDjs = await prisma.djProfile.findMany({
      where: {
        contractorStatus: "ACTIVE",
        isAcceptingBookings: true,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        bookings: {
          select: {
            eventDate: true,
            eventType: true,
            status: true,
          },
          where: {
            status: {
              in: ["CONFIRMED", "COMPLETED"],
            },
          },
        },
      },
    });

    // Score and rank DJs for this booking
    const djSuggestions = await Promise.all(
      allDjs.map(async (dj) => {
        // Check availability
        const { available } = await isDjAvailable(
          dj.id,
          booking.startTime,
          booking.endTime,
          booking.id
        );

        if (!available) {
          return null; // Skip unavailable DJs
        }

        // Calculate scoring
        const score = calculateDjScore(dj, booking);

        return {
          id: dj.id,
          stageName: dj.stageName,
          name: dj.user.name,
          email: dj.user.email,
          rating: dj.rating,
          totalBookings: dj.totalBookings,
          contractorStatus: dj.contractorStatus,
          isPreferred: dj.id === booking.preferredDjId,
          score,
          scoreBreakdown: getScoreBreakdown(dj, booking),
        };
      })
    );

    // Filter out null values and sort by score
    const rankedDjs = djSuggestions
      .filter((dj) => dj !== null)
      .sort((a, b) => b!.score - a!.score);

    return NextResponse.json({
      success: true,
      suggestions: rankedDjs,
      booking: {
        id: booking.id,
        eventType: booking.eventType,
        eventDate: booking.eventDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        preferredDj: booking.preferredDj,
      },
    });
  } catch (error) {
    console.error("Error generating DJ suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}

// Calculate DJ suitability score for a booking
function calculateDjScore(dj: any, booking: any): number {
  let score = 0;

  // Base score for all active DJs
  score += 10;

  // Client preference (high weight)
  if (dj.id === booking.preferredDjId) {
    score += 50;
  }

  // DJ rating (0-5 scale, multiply by 10 for weight)
  score += (dj.rating || 0) * 10;

  // Experience with this event type
  const eventTypeExperience = dj.bookings.filter(
    (b: any) => b.eventType === booking.eventType
  ).length;
  score += Math.min(eventTypeExperience * 5, 25); // Max 25 points

  // Recent activity (more active = better)
  const recentBookings = dj.bookings.filter((b: any) => {
    const eventDate = new Date(b.eventDate);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return eventDate >= sixMonthsAgo;
  }).length;
  score += Math.min(recentBookings * 2, 20); // Max 20 points

  // Total experience
  score += Math.min(dj.totalBookings * 0.5, 15); // Max 15 points

  // Weekend premium (if booking is on weekend)
  const eventDay = new Date(booking.eventDate).getDay();
  if (eventDay === 0 || eventDay === 6) {
    score += 5;
  }

  return Math.round(score);
}

// Get detailed score breakdown for transparency
function getScoreBreakdown(dj: any, booking: any) {
  const breakdown: any = {};

  breakdown.baseScore = 10;
  breakdown.clientPreference = dj.id === booking.preferredDjId ? 50 : 0;
  breakdown.rating = (dj.rating || 0) * 10;

  const eventTypeExperience = dj.bookings.filter(
    (b: any) => b.eventType === booking.eventType
  ).length;
  breakdown.eventExperience = Math.min(eventTypeExperience * 5, 25);

  const recentBookings = dj.bookings.filter((b: any) => {
    const eventDate = new Date(b.eventDate);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return eventDate >= sixMonthsAgo;
  }).length;
  breakdown.recentActivity = Math.min(recentBookings * 2, 20);

  breakdown.totalExperience = Math.min(dj.totalBookings * 0.5, 15);

  const eventDay = new Date(booking.eventDate).getDay();
  breakdown.weekendBonus = eventDay === 0 || eventDay === 6 ? 5 : 0;

  return breakdown;
}
