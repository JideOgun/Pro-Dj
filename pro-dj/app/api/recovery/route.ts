import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { acceptRecoverySuggestion } from "@/lib/booking-recovery";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json(
        { ok: false, error: "Booking ID required" },
        { status: 400 }
      );
    }

    const recoveries = await prisma.bookingRecovery.findMany({
      where: {
        originalBookingId: bookingId,
        status: "PENDING",
      },
      include: {
        suggestedDj: true,
        originalBooking: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      {
        ok: true,
        data: recoveries,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching recoveries:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch recoveries" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { recoveryId, action, response, notificationId } = body;

    if (action === "accept") {
      const success = await acceptRecoverySuggestion(
        recoveryId,
        response || ""
      );

      if (success) {
        // Mark notification as read if provided
        if (notificationId) {
          await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
          });
        }

        return NextResponse.json(
          {
            ok: true,
            message: "Recovery suggestion accepted successfully",
          },
          { status: 200 }
        );
      } else {
        return NextResponse.json(
          { ok: false, error: "Failed to accept recovery suggestion" },
          { status: 400 }
        );
      }
    } else if (action === "decline") {
      await prisma.bookingRecovery.update({
        where: { id: recoveryId },
        data: {
          status: "DECLINED",
          clientResponse: response || "",
        },
      });

      // Mark notification as read if provided
      if (notificationId) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: { isRead: true },
        });
      }

      return NextResponse.json(
        {
          ok: true,
          message: "Recovery suggestion declined",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error handling recovery action:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to process recovery action" },
      { status: 500 }
    );
  }
}
