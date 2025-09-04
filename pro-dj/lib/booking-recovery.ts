import { prisma } from "./prisma";
import { getAvailableDjs } from "./booking-utils";

export interface RecoverySuggestion {
  type: "EXTEND_DJ" | "NEW_DJ" | "REFUND";
  suggestedDjId?: string;
  suggestedDj?: {
    id: string;
    stageName: string;
    genres: string[];
    basePriceCents: number;
  };
  message: string;
  actionUrl?: string;
}

export async function handleBookingRejection(
  bookingId: string,
  reason: string
): Promise<void> {
  try {
    // Get the rejected booking with related data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        dj: true,
      },
    });

    if (!booking) {
      console.error("Booking not found for rejection handling:", bookingId);
      return;
    }

    // Get other bookings for the same event (same date and user)
    const eventBookings = await prisma.booking.findMany({
      where: {
        userId: booking.userId,
        eventDate: booking.eventDate,
        status: { in: ["PENDING_ADMIN_REVIEW", "ADMIN_REVIEWING", "DJ_ASSIGNED", "CONFIRMED"] },
      },
      include: {
        dj: true,
      },
    });

    // Generate recovery suggestions
    const suggestions = await generateRecoverySuggestions(
      booking,
      eventBookings
    );

    // Create notification for client
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        type: "BOOKING_REJECTED",
        title: "DJ Booking Rejected",
        message: `Your booking with ${
          booking.dj?.stageName || "DJ"
        } has been rejected. We have some suggestions to help you recover.`,
        data: {
          bookingId,
          rejectedDjId: booking.djId,
          rejectedDjName: booking.dj?.stageName,
          reason,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          suggestions: suggestions as any,
          eventDate: booking.eventDate,
          eventType: booking.eventType,
        },
        actionUrl: `/dashboard/client/recovery?bookingId=${bookingId}`,
      },
    });

    // Create recovery records
    for (const suggestion of suggestions) {
      await prisma.bookingRecovery.create({
        data: {
          originalBookingId: bookingId,
          recoveryType: suggestion.type,
          suggestedDjId: suggestion.suggestedDjId,
          status: "PENDING",
        },
      });
    }

    console.log(`Recovery suggestions created for booking ${bookingId}`);
  } catch (error) {
    console.error("Error handling booking rejection:", error);
  }
}

async function generateRecoverySuggestions(
  rejectedBooking: {
    id: string;
    startTime: Date;
    endTime: Date;
    eventDate: Date;
    eventType: string;
    djId?: string | null;
    details?: unknown;
  },
  eventBookings: Array<{
    id: string;
    djId: string | null;
    dj: {
      id: string;
      stageName: string;
      genres: string[];
      basePriceCents: number | null;
    } | null;
    status: string;
  }>
): Promise<RecoverySuggestion[]> {
  const suggestions: RecoverySuggestion[] = [];

  // Check if there are other confirmed DJs for the same event
  const confirmedBookings = eventBookings.filter(
    (b) => b.status === "CONFIRMED" && b.id !== rejectedBooking.id
  );

  if (confirmedBookings.length > 0) {
    // Option 1: Extend existing DJ's time
    for (const confirmedBooking of confirmedBookings) {
      if (
        confirmedBooking.dj &&
        confirmedBooking.djId &&
        confirmedBooking.dj.basePriceCents !== null
      ) {
        suggestions.push({
          type: "EXTEND_DJ",
          suggestedDjId: confirmedBooking.djId,
          suggestedDj: {
            id: confirmedBooking.dj.id,
            stageName: confirmedBooking.dj.stageName,
            genres: confirmedBooking.dj.genres,
            basePriceCents: confirmedBooking.dj.basePriceCents,
          },
          message: `Extend ${
            confirmedBooking.dj.stageName
          }'s time to cover the gap from ${rejectedBooking.startTime.toLocaleTimeString()} to ${rejectedBooking.endTime.toLocaleTimeString()}`,
          actionUrl: `/dashboard/client/extend-dj?bookingId=${
            confirmedBooking.id
          }&gapStart=${rejectedBooking.startTime.toISOString()}&gapEnd=${rejectedBooking.endTime.toISOString()}`,
        });
      }
    }
  }

  // Option 2: Find available DJs for the time slot
  const availableDjs = await getAvailableDjs(
    rejectedBooking.startTime,
    rejectedBooking.endTime
  );

  // Filter out DJs already booked for this event AND the original rejected DJ
  const eventDjIds = eventBookings.map((b) => b.djId).filter(Boolean);
  const originalDjId = rejectedBooking.djId; // Get the original DJ's ID
  const newDjs = availableDjs.filter(
    (dj) => !eventDjIds.includes(dj.id) && dj.id !== originalDjId
  );

  // Get client preferences from booking details
  const clientPreferences = rejectedBooking.details as {
    preferredGenres?: string[];
    musicStyle?: string;
    eventVibe?: string;
  } | null;

  // Sort DJs by preference match if client has preferences
  let sortedDjs = newDjs;
  if (clientPreferences?.preferredGenres?.length) {
    sortedDjs = newDjs.sort((a, b) => {
      const aMatches = a.genres.filter((genre) =>
        clientPreferences.preferredGenres!.includes(genre)
      ).length;
      const bMatches = b.genres.filter((genre) =>
        clientPreferences.preferredGenres!.includes(genre)
      ).length;
      return bMatches - aMatches; // Sort by most matches first
    });
  }

  // Suggest only ONE DJ replacement (the best match based on preferences)
  if (sortedDjs.length > 0) {
    const bestMatchDj = sortedDjs[0];
    if (bestMatchDj.basePriceCents !== null) {
      suggestions.push({
        type: "NEW_DJ",
        suggestedDjId: bestMatchDj.id,
        suggestedDj: {
          id: bestMatchDj.id,
          stageName: bestMatchDj.stageName,
          genres: bestMatchDj.genres,
          basePriceCents: bestMatchDj.basePriceCents,
        },
        message: `Replace with ${
          bestMatchDj.stageName
        } for the same time slot (${rejectedBooking.startTime.toLocaleTimeString()} - ${rejectedBooking.endTime.toLocaleTimeString()})${
          clientPreferences?.preferredGenres?.length
            ? ` - Specializes in ${bestMatchDj.genres
                .filter((genre) =>
                  clientPreferences.preferredGenres!.includes(genre)
                )
                .slice(0, 2)
                .join(", ")}`
            : ""
        }`,
        actionUrl: `/book?djId=${bestMatchDj.id}&eventDate=${
          rejectedBooking.eventDate.toISOString().split("T")[0]
        }&startTime=${rejectedBooking.startTime.toLocaleTimeString()}&endTime=${rejectedBooking.endTime.toLocaleTimeString()}&recovery=true`,
      });
    }
  }

  // Option 3: Refund if no good alternatives
  if (suggestions.length === 0) {
    suggestions.push({
      type: "REFUND",
      message:
        "No suitable DJs available for this time slot. We can process a refund for the rejected booking.",
      actionUrl: `/dashboard/client/refund?bookingId=${rejectedBooking.id}`,
    });
  }

  return suggestions;
}

export async function acceptRecoverySuggestion(
  recoveryId: string,
  clientResponse: string
): Promise<boolean> {
  try {
    const recovery = await prisma.bookingRecovery.findUnique({
      where: { id: recoveryId },
      include: {
        originalBooking: true,
        suggestedDj: true,
      },
    });

    if (!recovery) {
      return false;
    }

    // Update recovery status
    await prisma.bookingRecovery.update({
      where: { id: recoveryId },
      data: {
        status: "ACCEPTED",
        clientResponse,
      },
    });

    // Handle based on recovery type
    switch (recovery.recoveryType) {
      case "EXTEND_DJ":
        // Extend the existing DJ's booking
        await extendDjBooking(
          recovery as unknown as {
            suggestedDjId: string;
            originalBooking: { userId: string; eventDate: Date; endTime: Date };
          }
        );
        break;
      case "NEW_DJ":
        // Create a new booking with the suggested DJ
        await createNewDjBooking(
          recovery as unknown as {
            suggestedDjId: string;
            originalBooking: {
              userId: string;
              eventType: string;
              eventDate: Date;
              startTime: Date;
              endTime: Date;
              message: string;
              bookingType: string | null;
              packageKey: string | null;
              quotedPriceCents: number | null;
              details: unknown;
            };
          }
        );
        break;
      case "REFUND":
        // Process refund
        await processRefund(
          recovery as unknown as {
            originalBookingId: string;
            originalBooking: {
              userId: string;
              quotedPriceCents: number | null;
            };
          }
        );
        break;
    }

    return true;
  } catch (error) {
    console.error("Error accepting recovery suggestion:", error);
    return false;
  }
}

interface ExtendDjRecovery {
  suggestedDjId: string;
  originalBooking: { userId: string; eventDate: Date; endTime: Date };
}

async function extendDjBooking(recovery: ExtendDjRecovery): Promise<void> {
  // Find the existing booking to extend
  const existingBooking = await prisma.booking.findFirst({
    where: {
      djId: recovery.suggestedDjId,
      userId: recovery.originalBooking.userId,
      eventDate: recovery.originalBooking.eventDate,
      status: { in: ["CONFIRMED", "DJ_ASSIGNED"] },
    },
  });

  if (existingBooking) {
    // Extend the end time to cover the gap
    const gapEndTime = recovery.originalBooking.endTime;
    if (gapEndTime > existingBooking.endTime) {
      await prisma.booking.update({
        where: { id: existingBooking.id },
        data: { endTime: gapEndTime },
      });
    }
  }
}

interface NewDjRecovery {
  suggestedDjId: string;
  originalBooking: {
    userId: string;
    eventType: string;
    eventDate: Date;
    startTime: Date;
    endTime: Date;
    message: string;
    bookingType: string | null;
    packageKey: string | null;
    quotedPriceCents: number | null;
    details: unknown;
  };
}

async function createNewDjBooking(recovery: NewDjRecovery): Promise<void> {
  // Create a new booking with the suggested DJ
  await prisma.booking.create({
    data: {
      userId: recovery.originalBooking.userId,
      djId: recovery.suggestedDjId,
      eventType: recovery.originalBooking.eventType,
      eventDate: recovery.originalBooking.eventDate,
      startTime: recovery.originalBooking.startTime,
      endTime: recovery.originalBooking.endTime,
      message: recovery.originalBooking.message,
      bookingType: recovery.originalBooking.bookingType,
      packageKey: recovery.originalBooking.packageKey,
      quotedPriceCents: recovery.originalBooking.quotedPriceCents,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      details: recovery.originalBooking.details as any,
      status: "PENDING",
    },
  });
}

interface RefundRecovery {
  originalBookingId: string;
  originalBooking: {
    userId: string;
    quotedPriceCents: number | null;
  };
}

async function processRefund(recovery: RefundRecovery): Promise<void> {
  // Mark the original booking for refund
  await prisma.booking.update({
    where: { id: recovery.originalBookingId },
    data: { status: "CANCELLED" },
  });

  // Create refund notification
  await prisma.notification.create({
    data: {
      userId: recovery.originalBooking.userId,
      type: "REFUND_PROCESSED",
      title: "Refund Processed",
      message: "Your refund has been processed for the rejected booking.",
      data: {
        bookingId: recovery.originalBookingId,
        amount: recovery.originalBooking.quotedPriceCents,
      },
    },
  });
}
