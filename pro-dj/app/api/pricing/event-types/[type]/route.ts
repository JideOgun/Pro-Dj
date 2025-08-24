import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE - Delete an event type and all its packages
export async function DELETE(
  req: NextRequest,
  { params }: { params: { type: string  } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only admins can delete event types
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { type } = params;
    const decodedType = decodeURIComponent(type);

    if (!decodedType) {
      return NextResponse.json(
        { error: "Event type is required" },
        { status: 400 }
      );
    }

    // Check if event type exists
    const existingPackages = await prisma.pricing.findMany({
      where: { type: decodedType },
    });

    if (existingPackages.length === 0) {
      return NextResponse.json(
        { error: "Event type not found" },
        { status: 404 }
      );
    }

    // Check if any packages from this event type are being used in bookings
    const packageKeys = existingPackages.map((pkg) => pkg.key);
    const bookingsUsingPackages = await prisma.booking.findFirst({
      where: {
        packageKey: {
          in: packageKeys,
        },
      },
    });

    if (bookingsUsingPackages) {
      return NextResponse.json(
        {
          error:
            "Cannot delete event type that has packages being used in existing bookings",
        },
        { status: 400 }
      );
    }

    // Delete all packages for this event type
    const deletedPackages = await prisma.pricing.deleteMany({
      where: { type: decodedType },
    });

    return NextResponse.json({
      success: true,
      message: "Event type and all its packages deleted successfully",
      deletedPackages: deletedPackages.count,
    });
  } catch (error) {
    console.error("Error deleting event type:", error);
    return NextResponse.json(
      { error: "Failed to delete event type" },
      { status: 500 }
    );
  }
}
