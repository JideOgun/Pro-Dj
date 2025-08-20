import { prisma } from "./prisma";

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
}

/**
 * Check if two time slots overlap
 */
export function hasTimeConflict(slot1: TimeSlot, slot2: TimeSlot): boolean {
  return slot1.startTime < slot2.endTime && slot2.startTime < slot1.endTime;
}

/**
 * Check if a DJ is available for a given time slot
 */
export async function isDjAvailable(
  djId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
): Promise<{ available: boolean; conflictingBookings: unknown[] }> {
  console.log("🔍 Checking DJ availability:", {
    djId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    excludeBookingId,
  });

  const conflictingBookings = await prisma.booking.findMany({
    where: {
      djId,
      status: {
        in: ["PENDING", "ACCEPTED", "CONFIRMED"], // Only check active bookings
      },
      ...(excludeBookingId && { id: { not: excludeBookingId } }),
      OR: [
        // Check for any overlap with existing bookings
        {
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      ],
    },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  console.log("📊 Found conflicting bookings:", conflictingBookings.length);
  if (conflictingBookings.length > 0) {
    console.log(
      "⚠️ Conflicts:",
      conflictingBookings.map((b) => ({
        id: b.id,
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
        status: b.status,
        eventType: b.eventType,
      }))
    );
  }

  return {
    available: conflictingBookings.length === 0,
    conflictingBookings,
  };
}

/**
 * Check if there are any overlapping time slots for the same event
 * This prevents multiple DJs from having overlapping times
 */
export async function checkEventTimeConflicts(
  eventDate: Date,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
): Promise<{ hasConflicts: boolean; conflictingBookings: unknown[] }> {
  console.log("🔍 Checking event time conflicts:", {
    eventDate: eventDate.toISOString(),
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    excludeBookingId,
  });

  // Find all bookings for the same event date that have overlapping times
  const conflictingBookings = await prisma.booking.findMany({
    where: {
      eventDate: {
        gte: new Date(
          eventDate.getFullYear(),
          eventDate.getMonth(),
          eventDate.getDate()
        ),
        lt: new Date(
          eventDate.getFullYear(),
          eventDate.getMonth(),
          eventDate.getDate() + 1
        ),
      },
      status: {
        in: ["PENDING", "ACCEPTED", "CONFIRMED"],
      },
      ...(excludeBookingId && { id: { not: excludeBookingId } }),
      OR: [
        // Check for any overlap with existing bookings
        {
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      ],
    },
    include: {
      user: { select: { name: true, email: true } },
      dj: { select: { stageName: true } },
    },
  });

  console.log("📊 Found event time conflicts:", conflictingBookings.length);
  if (conflictingBookings.length > 0) {
    console.log(
      "⚠️ Event conflicts:",
      conflictingBookings.map((b) => ({
        id: b.id,
        djName: b.dj?.stageName,
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
        status: b.status,
        eventType: b.eventType,
      }))
    );
  }

  return {
    hasConflicts: conflictingBookings.length > 0,
    conflictingBookings,
  };
}

/**
 * Get all DJs available for a given time slot
 */
export async function getAvailableDjs(
  startTime: Date,
  endTime: Date
): Promise<
  Array<{
    id: string;
    stageName: string;
    genres: string[];
    basePriceCents: number | null;
    location: string;
  }>
> {
  const allDjs = await prisma.djProfile.findMany({
    where: {
      isAcceptingBookings: true,
      isApprovedByAdmin: true, // Only show admin-approved DJs
      user: {
        status: "ACTIVE", // Only show active users
      },
    },
    include: {
      user: {
        select: { name: true, email: true, status: true, location: true },
      },
    },
  });

  const availableDjs = [];

  for (const dj of allDjs) {
    const { available } = await isDjAvailable(dj.id, startTime, endTime);
    if (available) {
      availableDjs.push({
        id: dj.id,
        stageName: dj.stageName,
        genres: dj.genres || [],
        basePriceCents: dj.basePriceCents,
        location: dj.user.location || dj.location || "Location not set",
      });
    }
  }

  return availableDjs;
}

/**
 * Validate booking time slot
 */
export function validateBookingTime(
  startTime: Date,
  endTime: Date
): { valid: boolean; error?: string } {
  const now = new Date();

  // Check if booking is in the past
  if (startTime <= now) {
    return {
      valid: false,
      error:
        "❌ Event time has already passed. Please select a future date and time for your event.",
    };
  }

  // Check if booking is too far in the future (e.g., 2 years)
  const twoYearsFromNow = new Date();
  twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
  if (startTime > twoYearsFromNow) {
    return {
      valid: false,
      error:
        "📅 Event date is too far in the future. Please select a date within the next 2 years for your booking.",
    };
  }

  // Calculate duration in hours, handling overnight events
  const durationHours =
    (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

  // For overnight events, if end time is before start time, it means it goes into the next day
  // In this case, we need to add 24 hours to get the correct duration
  const adjustedDurationHours =
    endTime < startTime ? durationHours + 24 : durationHours;

  // Check if booking duration is reasonable (e.g., 1-12 hours)
  if (adjustedDurationHours < 1) {
    return {
      valid: false,
      error:
        "⏰ Event duration is too short. Please ensure your event is at least 1 hour long.",
    };
  }
  if (adjustedDurationHours > 12) {
    return {
      valid: false,
      error:
        "⏰ Event duration is too long. Please keep your event under 12 hours for optimal DJ performance.",
    };
  }

  return { valid: true };
}

/**
 * Format time for display
 */
export function formatTimeRange(startTime: Date, endTime: Date): string {
  const start = startTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const end = endTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${start} - ${end}`;
}

/**
 * Calculate booking duration in hours
 */
export function getBookingDuration(startTime: Date, endTime: Date): number {
  const durationHours =
    (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

  // For overnight events, if end time is before start time, it means it goes into the next day
  // In this case, we need to add 24 hours to get the correct duration
  return endTime < startTime ? durationHours + 24 : durationHours;
}
