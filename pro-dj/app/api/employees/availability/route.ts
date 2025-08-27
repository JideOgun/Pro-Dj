import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only employees can set availability
    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!djProfile || !["PART_TIME_W2", "FULL_TIME_W2"].includes(djProfile.employmentType)) {
      return NextResponse.json(
        { error: "Only Pro-DJ employees can set availability" },
        { status: 403 }
      );
    }

    const { availability } = await request.json();

    if (!Array.isArray(availability)) {
      return NextResponse.json(
        { error: "Availability must be an array of time slots" },
        { status: 400 }
      );
    }

    // Clear existing availability
    await prisma.djAvailability.deleteMany({
      where: { djId: djProfile.id },
    });

    // Create new availability records
    const availabilityRecords = [];
    for (const slot of availability) {
      const { dayOfWeek, startTime, endTime, isAvailable } = slot;

      if (
        typeof dayOfWeek !== "number" ||
        dayOfWeek < 0 ||
        dayOfWeek > 6 ||
        !startTime ||
        !endTime
      ) {
        return NextResponse.json(
          { error: "Invalid availability data" },
          { status: 400 }
        );
      }

      const record = await prisma.djAvailability.create({
        data: {
          djId: djProfile.id,
          dayOfWeek,
          startTime,
          endTime,
          isAvailable: isAvailable !== false, // Default to true
        },
      });

      availabilityRecords.push(record);
    }

    return NextResponse.json({
      success: true,
      message: "Availability updated successfully",
      availability: availabilityRecords,
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    return NextResponse.json(
      { error: "Failed to update availability" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const djId = searchParams.get("djId");

    // If djId is provided (admin view), check admin permissions
    if (djId && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required to view other DJs' availability" },
        { status: 403 }
      );
    }

    // Get DJ profile
    let targetDjId = djId;
    if (!djId) {
      const djProfile = await prisma.djProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!djProfile) {
        return NextResponse.json(
          { error: "DJ profile not found" },
          { status: 404 }
        );
      }

      targetDjId = djProfile.id;
    }

    // Get availability
    const availability = await prisma.djAvailability.findMany({
      where: { djId: targetDjId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    // Format for frontend
    const formattedAvailability = Array.from({ length: 7 }, (_, dayIndex) => {
      const daySlots = availability.filter((slot) => slot.dayOfWeek === dayIndex);
      return {
        dayOfWeek: dayIndex,
        dayName: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayIndex],
        slots: daySlots.map((slot) => ({
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: slot.isAvailable,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      availability: formattedAvailability,
    });
  } catch (error) {
    console.error("Error getting availability:", error);
    return NextResponse.json(
      { error: "Failed to get availability" },
      { status: 500 }
    );
  }
}
