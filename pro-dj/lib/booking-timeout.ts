import { prisma } from "./prisma";
import { handleBookingRejection } from "./booking-recovery";

// Timeout configuration
const PENDING_BOOKING_TIMEOUT_HOURS = 48; // 2 days
const URGENT_TIMEOUT_HOURS = 24; // 1 day for events within 7 days

/**
 * Calculate timeout date based on event proximity
 */
function getTimeoutDate(createdAt: Date, eventDate: Date): Date {
  const now = new Date();
  const daysUntilEvent = Math.ceil(
    (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // If event is within 7 days, use urgent timeout (24 hours)
  if (daysUntilEvent <= 7) {
    return new Date(
      createdAt.getTime() + URGENT_TIMEOUT_HOURS * 60 * 60 * 1000
    );
  }

  // Otherwise use standard timeout (48 hours)
  return new Date(
    createdAt.getTime() + PENDING_BOOKING_TIMEOUT_HOURS * 60 * 60 * 1000
  );
}

/**
 * Check if a booking has expired based on its creation time and event date
 */
export function isBookingExpired(createdAt: Date, eventDate: Date): boolean {
  const timeoutDate = getTimeoutDate(createdAt, eventDate);
  return new Date() > timeoutDate;
}

/**
 * Get all expired pending bookings
 */
export async function getExpiredPendingBookings() {
  const now = new Date();

  // Get all pending bookings
  const pendingBookings = await prisma.booking.findMany({
    where: {
      status: "PENDING",
    },
    include: {
      user: true,
      dj: true,
    },
  });

  // Filter for expired bookings
  return pendingBookings.filter((booking) =>
    isBookingExpired(booking.createdAt, booking.eventDate)
  );
}

/**
 * Handle timeout for a single booking
 */
export async function handleBookingTimeout(bookingId: string): Promise<void> {
  try {
    console.log(`🕐 Handling timeout for booking ${bookingId}`);

    // Get the booking with related data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        dj: true,
      },
    });

    if (!booking) {
      console.error("Booking not found for timeout handling:", bookingId);
      return;
    }

    if (booking.status !== "PENDING") {
      console.log(
        `Booking ${bookingId} is no longer pending, skipping timeout`
      );
      return;
    }

    // Update booking status to DECLINED
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "DECLINED",
        cancellationReason:
          "DJ did not respond within the required time period",
        cancelledAt: new Date(),
        cancelledBy: "SYSTEM",
      },
    });

    // Create notification for client
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        type: "BOOKING_TIMEOUT",
        title: "Booking Request Expired",
        message: `Your booking request with ${
          booking.dj?.stageName || "DJ"
        } has expired because they didn't respond within the required time. We have some suggestions to help you find another DJ.`,
        data: {
          bookingId,
          expiredDjId: booking.djId,
          expiredDjName: booking.dj?.stageName,
          eventDate: booking.eventDate,
          eventType: booking.eventType,
        },
        actionUrl: `/dashboard/client/recovery?bookingId=${bookingId}`,
      },
    });

    // Create notification for DJ (optional - let them know they missed an opportunity)
    if (booking.djId) {
      await prisma.notification.create({
        data: {
          userId: booking.dj.userId,
          type: "MISSED_BOOKING",
          title: "Missed Booking Opportunity",
          message: `You missed a booking opportunity for ${
            booking.eventType
          } on ${booking.eventDate.toLocaleDateString()}. Please respond to booking requests within 48 hours to avoid missing future opportunities.`,
          data: {
            bookingId,
            eventDate: booking.eventDate,
            eventType: booking.eventType,
          },
        },
      });
    }

    // Trigger recovery suggestions (same as rejection)
    await handleBookingRejection(
      bookingId,
      "DJ did not respond within the required time period"
    );

    console.log(`✅ Successfully handled timeout for booking ${bookingId}`);
  } catch (error) {
    console.error("Error handling booking timeout:", error);
  }
}

/**
 * Process all expired pending bookings
 */
export async function processExpiredPendingBookings(): Promise<void> {
  try {
    console.log("🕐 Checking for expired pending bookings...");

    const expiredBookings = await getExpiredPendingBookings();

    if (expiredBookings.length === 0) {
      console.log("No expired pending bookings found");
      return;
    }

    console.log(`Found ${expiredBookings.length} expired pending bookings`);

    // Process each expired booking
    for (const booking of expiredBookings) {
      await handleBookingTimeout(booking.id);
    }

    console.log(`✅ Processed ${expiredBookings.length} expired bookings`);
  } catch (error) {
    console.error("Error processing expired pending bookings:", error);
  }
}

/**
 * Get timeout information for a booking (for display purposes)
 */
export function getBookingTimeoutInfo(createdAt: Date, eventDate: Date) {
  const timeoutDate = getTimeoutDate(createdAt, eventDate);
  const now = new Date();
  const timeLeft = timeoutDate.getTime() - now.getTime();

  if (timeLeft <= 0) {
    return {
      isExpired: true,
      timeLeft: 0,
      timeLeftFormatted: "Expired",
      timeoutDate,
    };
  }

  const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
  const daysLeft = Math.ceil(hoursLeft / 24);

  return {
    isExpired: false,
    timeLeft,
    timeLeftFormatted: daysLeft > 1 ? `${daysLeft} days` : `${hoursLeft} hours`,
    timeoutDate,
  };
}
