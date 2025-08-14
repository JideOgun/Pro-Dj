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

  return {
    available: conflictingBookings.length === 0,
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
  }>
> {
  const allDjs = await prisma.djProfile.findMany({
    where: { isActive: true },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  const availableDjs = [];

  for (const dj of allDjs) {
    const { available } = await isDjAvailable(dj.id, startTime, endTime);
    if (available) {
      availableDjs.push(dj);
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
    return { valid: false, error: "Booking cannot be in the past" };
  }

  // Check if booking is too far in the future (e.g., 2 years)
  const twoYearsFromNow = new Date();
  twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
  if (startTime > twoYearsFromNow) {
    return {
      valid: false,
      error: "Booking cannot be more than 2 years in the future",
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
    return { valid: false, error: "Booking must be at least 1 hour long" };
  }
  if (adjustedDurationHours > 12) {
    return { valid: false, error: "Booking cannot exceed 12 hours" };
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
