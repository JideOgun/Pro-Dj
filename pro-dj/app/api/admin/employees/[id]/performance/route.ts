import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: djId } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const {
      bookingId,
      clientRating,
      onTimeArrival,
      equipmentFunctional,
      professionalAppearance,
      clientFeedback,
      adminNotes,
    } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Verify the booking exists and belongs to this DJ
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        dj: { select: { id: true, stageName: true, employmentType: true } },
      },
    });

    if (!booking || booking.djId !== djId) {
      return NextResponse.json(
        { error: "Booking not found or does not belong to this DJ" },
        { status: 404 }
      );
    }

    if (!["PART_TIME_W2", "FULL_TIME_W2"].includes(booking.dj?.employmentType || "")) {
      return NextResponse.json(
        { error: "Performance tracking only available for employees" },
        { status: 400 }
      );
    }

    // Check if performance metric already exists
    const existingMetric = await prisma.djPerformanceMetric.findUnique({
      where: {
        djId_bookingId: {
          djId,
          bookingId,
        },
      },
    });

    if (existingMetric) {
      return NextResponse.json(
        { error: "Performance metric already exists for this booking" },
        { status: 400 }
      );
    }

    // Create performance metric
    const performanceMetric = await prisma.djPerformanceMetric.create({
      data: {
        djId,
        bookingId,
        clientRating: clientRating ? parseInt(clientRating.toString()) : null,
        onTimeArrival: typeof onTimeArrival === "boolean" ? onTimeArrival : null,
        equipmentFunctional: typeof equipmentFunctional === "boolean" ? equipmentFunctional : null,
        professionalAppearance: typeof professionalAppearance === "boolean" ? professionalAppearance : null,
        clientFeedback,
        adminNotes,
      },
    });

    // Update DJ's overall performance rating
    const allMetrics = await prisma.djPerformanceMetric.findMany({
      where: { djId },
      select: { clientRating: true },
    });

    const validRatings = allMetrics
      .map((metric) => metric.clientRating)
      .filter((rating): rating is number => rating !== null);

    if (validRatings.length > 0) {
      const averageRating = validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length;
      
      await prisma.djProfile.update({
        where: { id: djId },
        data: {
          performanceRating: averageRating,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Performance metric recorded successfully",
      performanceMetric: {
        id: performanceMetric.id,
        djId: performanceMetric.djId,
        bookingId: performanceMetric.bookingId,
        clientRating: performanceMetric.clientRating,
        onTimeArrival: performanceMetric.onTimeArrival,
        equipmentFunctional: performanceMetric.equipmentFunctional,
        professionalAppearance: performanceMetric.professionalAppearance,
        clientFeedback: performanceMetric.clientFeedback,
        adminNotes: performanceMetric.adminNotes,
        createdAt: performanceMetric.createdAt,
      },
    });
  } catch (error) {
    console.error("Error recording performance metric:", error);
    return NextResponse.json(
      { error: "Failed to record performance metric" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: djId } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get DJ performance metrics
    const performanceMetrics = await prisma.djPerformanceMetric.findMany({
      where: { djId },
      include: {
        booking: {
          select: {
            id: true,
            eventType: true,
            eventDate: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate performance statistics
    const totalMetrics = performanceMetrics.length;
    const ratingsSum = performanceMetrics.reduce(
      (sum, metric) => sum + (metric.clientRating || 0),
      0
    );
    const validRatings = performanceMetrics.filter((metric) => metric.clientRating !== null);
    const averageRating = validRatings.length > 0 ? ratingsSum / validRatings.length : 0;

    const onTimeCount = performanceMetrics.filter((metric) => metric.onTimeArrival === true).length;
    const equipmentFunctionalCount = performanceMetrics.filter(
      (metric) => metric.equipmentFunctional === true
    ).length;
    const professionalCount = performanceMetrics.filter(
      (metric) => metric.professionalAppearance === true
    ).length;

    const onTimePercentage = totalMetrics > 0 ? (onTimeCount / totalMetrics) * 100 : 0;
    const equipmentFunctionalPercentage = totalMetrics > 0 ? (equipmentFunctionalCount / totalMetrics) * 100 : 0;
    const professionalPercentage = totalMetrics > 0 ? (professionalCount / totalMetrics) * 100 : 0;

    // Get recent bookings that don't have performance metrics yet
    const recentBookings = await prisma.booking.findMany({
      where: {
        djId,
        status: "CONFIRMED",
        eventDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
        performanceMetrics: {
          none: {},
        },
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { eventDate: "desc" },
    });

    return NextResponse.json({
      success: true,
      performanceMetrics: performanceMetrics.map((metric) => ({
        id: metric.id,
        booking: {
          id: metric.booking.id,
          eventType: metric.booking.eventType,
          eventDate: metric.booking.eventDate,
          clientName: metric.booking.user.name,
        },
        clientRating: metric.clientRating,
        onTimeArrival: metric.onTimeArrival,
        equipmentFunctional: metric.equipmentFunctional,
        professionalAppearance: metric.professionalAppearance,
        clientFeedback: metric.clientFeedback,
        adminNotes: metric.adminNotes,
        createdAt: metric.createdAt,
      })),
      statistics: {
        totalMetrics,
        averageRating: Math.round(averageRating * 10) / 10,
        onTimePercentage: Math.round(onTimePercentage),
        equipmentFunctionalPercentage: Math.round(equipmentFunctionalPercentage),
        professionalPercentage: Math.round(professionalPercentage),
      },
      pendingReviews: recentBookings.map((booking) => ({
        id: booking.id,
        eventType: booking.eventType,
        eventDate: booking.eventDate,
        clientName: booking.user.name,
      })),
    });
  } catch (error) {
    console.error("Error getting performance metrics:", error);
    return NextResponse.json(
      { error: "Failed to get performance metrics" },
      { status: 500 }
    );
  }
}
