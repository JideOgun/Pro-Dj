import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { eventDate, startTime, endTime, eventType } = await request.json();

    if (!eventDate || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Event date, start time, and end time are required" },
        { status: 400 }
      );
    }

    const eventDateTime = new Date(eventDate);
    const dayOfWeek = eventDateTime.getDay(); // 0 = Sunday, 6 = Saturday

    // Get all active employees
    const employees = await prisma.djProfile.findMany({
      where: {
        employmentType: {
          in: ["PART_TIME_W2", "FULL_TIME_W2"],
        },
        isAcceptingBookings: true,
        backgroundCheckCompleted: true,
        equipmentTrainingCompleted: true,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        availability: {
          where: {
            dayOfWeek,
            isAvailable: true,
          },
        },
        bookings: {
          where: {
            eventDate: eventDateTime,
            status: {
              in: ["ACCEPTED", "CONFIRMED"],
            },
          },
        },
      },
    });

    // Check availability for each employee
    const availableEmployees = [];
    const unavailableEmployees = [];

    for (const employee of employees) {
      let isAvailable = false;
      let unavailableReason = "";

      // Check if they have availability set for this day
      const dayAvailability = employee.availability.filter((avail) => {
        // Check if the requested time falls within their available hours
        const availStart = avail.startTime;
        const availEnd = avail.endTime;
        
        return (
          startTime >= availStart &&
          endTime <= availEnd
        );
      });

      if (dayAvailability.length === 0) {
        unavailableReason = "No availability set for this day/time";
      } else {
        // Check for booking conflicts
        const hasConflict = employee.bookings.some((booking) => {
          const bookingStart = new Date(`${eventDate}T${startTime}`);
          const bookingEnd = new Date(`${eventDate}T${endTime}`);
          const existingStart = booking.startTime;
          const existingEnd = booking.endTime;

          return (
            (bookingStart >= existingStart && bookingStart < existingEnd) ||
            (bookingEnd > existingStart && bookingEnd <= existingEnd) ||
            (bookingStart <= existingStart && bookingEnd >= existingEnd)
          );
        });

        if (hasConflict) {
          unavailableReason = "Already booked for this time";
        } else {
          isAvailable = true;
        }
      }

      const employeeData = {
        id: employee.id,
        stageName: employee.stageName,
        email: employee.user.email,
        name: employee.user.name,
        location: employee.location,
        experience: employee.experience,
        genres: employee.genres,
        rating: employee.rating,
        totalBookings: employee.totalBookings,
        performanceRating: employee.performanceRating,
        totalEventsCompleted: employee.totalEventsCompleted,
        hourlyRate: employee.hourlyRate,
        eventBonus: employee.eventBonus,
        availabilitySlots: dayAvailability.map((avail) => ({
          startTime: avail.startTime,
          endTime: avail.endTime,
        })),
      };

      if (isAvailable) {
        availableEmployees.push(employeeData);
      } else {
        unavailableEmployees.push({
          ...employeeData,
          unavailableReason,
        });
      }
    }

    // Sort available employees by performance rating and experience
    availableEmployees.sort((a, b) => {
      if (b.performanceRating !== a.performanceRating) {
        return b.performanceRating - a.performanceRating;
      }
      return b.totalEventsCompleted - a.totalEventsCompleted;
    });

    return NextResponse.json({
      success: true,
      eventDetails: {
        eventDate,
        startTime,
        endTime,
        eventType,
        dayOfWeek,
        dayName: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek],
      },
      availableEmployees,
      unavailableEmployees,
      summary: {
        totalEmployees: employees.length,
        available: availableEmployees.length,
        unavailable: unavailableEmployees.length,
      },
    });
  } catch (error) {
    console.error("Error checking employee availability:", error);
    return NextResponse.json(
      { error: "Failed to check employee availability" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get all employees with their current week availability
    const today = new Date();
    const currentDayOfWeek = today.getDay();

    const employees = await prisma.djProfile.findMany({
      where: {
        employmentType: {
          in: ["PART_TIME_W2", "FULL_TIME_W2"],
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        availability: {
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
        bookings: {
          where: {
            eventDate: {
              gte: today,
              lt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
            },
            status: {
              in: ["ACCEPTED", "CONFIRMED"],
            },
          },
          select: {
            eventDate: true,
            startTime: true,
            endTime: true,
            eventType: true,
          },
        },
      },
    });

    const employeeSchedules = employees.map((employee) => ({
      id: employee.id,
      stageName: employee.stageName,
      email: employee.user.email,
      name: employee.user.name,
      employmentType: employee.employmentType,
      isAcceptingBookings: employee.isAcceptingBookings,
      backgroundCheckCompleted: employee.backgroundCheckCompleted,
      equipmentTrainingCompleted: employee.equipmentTrainingCompleted,
      maxWeeklyHours: employee.maxWeeklyHours,
      availability: employee.availability,
      upcomingBookings: employee.bookings,
    }));

    return NextResponse.json({
      success: true,
      employees: employeeSchedules,
      currentDay: currentDayOfWeek,
    });
  } catch (error) {
    console.error("Error getting employee schedules:", error);
    return NextResponse.json(
      { error: "Failed to get employee schedules" },
      { status: 500 }
    );
  }
}
