import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// Initialize Stripe only if we have the secret key (not during build)
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    })
  : null;

export interface TerminationResult {
  success: boolean;
  affectedBookings: number;
  refundedBookings: number;
  notificationsSent: number;
  errors: string[];
}

export async function handleDjTermination(
  djUserId: string,
  terminationReason: string,
  adminId: string
): Promise<TerminationResult> {
  const result: TerminationResult = {
    success: false,
    affectedBookings: 0,
    refundedBookings: 0,
    notificationsSent: 0,
    errors: [],
  };

  try {
    // Get the DJ and their profile
    const dj = await prisma.user.findUnique({
      where: { id: djUserId },
      include: {
        djProfile: true,
      },
    });

    if (!dj || !dj.djProfile) {
      result.errors.push("DJ or DJ profile not found");
      return result;
    }

    // Get all active bookings for this DJ
    const activeBookings = await prisma.booking.findMany({
      where: {
        djId: dj.djProfile.id,
        status: {
          in: ["PENDING_ADMIN_REVIEW", "ADMIN_REVIEWING", "DJ_ASSIGNED", "CONFIRMED"],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    result.affectedBookings = activeBookings.length;

    // Process each booking
    for (const booking of activeBookings) {
      try {
        // Update booking status to CANCELLED
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "CANCELLED",
            cancellationReason: `DJ terminated from platform: ${terminationReason}`,
            cancelledAt: new Date(),
            cancelledBy: adminId,
          },
        });

        // Handle refund if payment was made
        if (booking.checkoutSessionId && booking.status === "CONFIRMED") {
          try {
            if (!stripe) {
              console.warn("Stripe not initialized - skipping refund");
              result.errors.push("Stripe not configured for refunds");
            } else {
              // Create refund in Stripe
              const refund = await stripe.refunds.create({
                payment_intent: booking.checkoutSessionId,
                reason: "requested_by_customer",
                metadata: {
                  bookingId: booking.id,
                  reason: "DJ terminated from platform",
                  adminId: adminId,
                },
              });

              // Update booking with refund information
              await prisma.booking.update({
                where: { id: booking.id },
                data: {
                  refundId: refund.id,
                  refundedAt: new Date(),
                  refundAmount: booking.totalAmount,
                },
              });

              result.refundedBookings++;
            }
          } catch (refundError) {
            console.error(
              `Failed to refund booking ${booking.id}:`,
              refundError
            );
            result.errors.push(`Failed to refund booking ${booking.id}`);
          }
        }

        // Create notification for the client
        await prisma.notification.create({
          data: {
            userId: booking.user.id,
            type: "DJ_TERMINATED",
            title: "DJ No Longer Available",
            message: `The DJ you booked for your event on ${new Date(
              booking.eventDate
            ).toLocaleDateString()} is no longer available. Your booking has been cancelled and you will receive a full refund if payment was made.`,
            data: {
              bookingId: booking.id,
              djName: dj.djProfile.stageName || dj.name || dj.email,
              eventDate: booking.eventDate,
              eventType: booking.eventType,
              refundAmount: booking.totalAmount,
              terminationReason: terminationReason,
            },
            isRead: false,
          },
        });

        result.notificationsSent++;

        // Create booking recovery suggestion
        await prisma.bookingRecovery.create({
          data: {
            userId: booking.user.id,
            originalBookingId: booking.id,
            type: "DJ_TERMINATED",
            status: "PENDING",
            suggestions: {
              message:
                "Your DJ has been terminated from the platform. We can help you find a replacement DJ.",
              options: [
                {
                  type: "FIND_REPLACEMENT",
                  label: "Find a replacement DJ",
                  description: "We'll help you find another DJ for your event",
                },
                {
                  type: "FULL_REFUND",
                  label: "Request full refund",
                  description: "Get a complete refund for your booking",
                },
              ],
            },
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        });
      } catch (bookingError) {
        console.error(`Failed to process booking ${booking.id}:`, bookingError);
        result.errors.push(`Failed to process booking ${booking.id}`);
      }
    }

    result.success = true;
    return result;
  } catch (error) {
    console.error("Error in DJ termination:", error);
    result.errors.push("Failed to process DJ termination");
    return result;
  }
}
