import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { id: string  } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);

    const booking = await prisma.booking.findUnique({
      where: { id },
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

    if (!booking) {
      return NextResponse.json(
        { ok: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to view this booking
    // Allow if user is admin/DJ or if it's their own booking
    const canView =
      session?.user?.role === "ADMIN" ||
      session?.user?.role === "DJ" ||
      booking.userId === session?.user?.id;

    if (!canView) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true, booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
