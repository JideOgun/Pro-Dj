import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { processExpiredPendingBookings } from "@/lib/booking-timeout";

// POST - Manually trigger timeout processing (admin only)
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admins to manually trigger timeout processing
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Process expired pending bookings
    await processExpiredPendingBookings();

    return NextResponse.json({
      ok: true,
      message: "Timeout processing completed successfully",
    });
  } catch (error) {
    console.error("Error processing booking timeouts:", error);
    return NextResponse.json(
      { error: "Failed to process booking timeouts" },
      { status: 500 }
    );
  }
}

// GET - Get timeout statistics (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admins to view timeout statistics
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { getExpiredPendingBookings } = await import("@/lib/booking-timeout");
    const expiredBookings = await getExpiredPendingBookings();

    return NextResponse.json({
      ok: true,
      data: {
        expiredCount: expiredBookings.length,
        expiredBookings: expiredBookings.map((booking) => ({
          id: booking.id,
          eventDate: booking.eventDate,
          eventType: booking.eventType,
          djName: booking.dj?.stageName,
          clientEmail: booking.user.email,
          createdAt: booking.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error getting timeout statistics:", error);
    return NextResponse.json(
      { error: "Failed to get timeout statistics" },
      { status: 500 }
    );
  }
}
