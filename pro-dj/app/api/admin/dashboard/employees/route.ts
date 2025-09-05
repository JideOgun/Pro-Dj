import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get current date for filtering
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all employees with comprehensive data
    const employees = await prisma.djProfile.findMany({
      where: {
        employmentType: {
          in: ["PART_TIME_W2", "FULL_TIME_W2"],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bookings: {
          where: {
            eventDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
            status: {
              in: ["DJ_ASSIGNED", "CONFIRMED"],
            },
          },
          select: {
            id: true,
            eventType: true,
            eventDate: true,
            quotedPriceCents: true,
            platformFeeCents: true,
            payoutAmountCents: true,
          },
        },
        payrollRecords: {
          where: {
            payPeriodStart: {
              gte: startOfMonth,
            },
            payPeriodEnd: {
              lte: endOfMonth,
            },
          },
          orderBy: {
            payPeriodStart: "desc",
          },
          take: 3,
        },
        performanceMetrics: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
        equipmentAssignments: {
          where: {
            returnedDate: null, // Currently assigned equipment
          },
          include: {
            equipment: {
              select: {
                name: true,
                category: true,
                condition: true,
              },
            },
          },
        },
        availability: {
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
      },
    });

    // Calculate statistics for each employee
    const employeeStats = employees.map((employee) => {
      const monthlyBookings = employee.bookings.length;
      const monthlyRevenue = employee.bookings.reduce(
        (sum, booking) => sum + (booking.platformFeeCents || 0),
        0
      );
      const monthlyPayout = employee.bookings.reduce(
        (sum, booking) => sum + (booking.payoutAmountCents || 0),
        0
      );

      const avgRating = employee.performanceMetrics.length > 0
        ? employee.performanceMetrics.reduce((sum, metric) => sum + (metric.clientRating || 0), 0) / employee.performanceMetrics.length
        : 0;

      return {
        id: employee.id,
        user: employee.user,
        stageName: employee.stageName,
        employmentType: employee.employmentType,
        employmentStartDate: employee.employmentStartDate,
        hourlyRate: employee.hourlyRate,
        eventBonus: employee.eventBonus,
        maxWeeklyHours: employee.maxWeeklyHours,
        backgroundCheckCompleted: employee.backgroundCheckCompleted,
        equipmentTrainingCompleted: employee.equipmentTrainingCompleted,
        isAcceptingBookings: employee.isAcceptingBookings,
        performanceRating: employee.performanceRating,
        totalEventsCompleted: employee.totalEventsCompleted,
        lastActiveDate: employee.lastActiveDate,
        monthlyStats: {
          bookings: monthlyBookings,
          revenueGenerated: monthlyRevenue,
          payoutEarned: monthlyPayout,
          averageRating: avgRating,
        },
        currentEquipment: employee.equipmentAssignments.map((assignment) => ({
          id: assignment.id,
          name: assignment.equipment.name,
          category: assignment.equipment.category,
          condition: assignment.equipment.condition,
          assignedDate: assignment.assignedDate,
        })),
        availability: employee.availability,
        recentPayroll: employee.payrollRecords[0] || null,
        recentPerformance: employee.performanceMetrics.slice(0, 3),
      };
    });

    // Calculate overall statistics
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((emp) => emp.isAcceptingBookings).length;
    const trainedEmployees = employees.filter(
      (emp) => emp.backgroundCheckCompleted && emp.equipmentTrainingCompleted
    ).length;

    const totalMonthlyRevenue = employees.reduce(
      (sum, emp) => sum + emp.bookings.reduce((bookingSum, booking) => bookingSum + (booking.platformFeeCents || 0), 0),
      0
    );

    const totalMonthlyBookings = employees.reduce(
      (sum, emp) => sum + emp.bookings.length,
      0
    );

    // Get pending payroll
    const pendingPayroll = await prisma.payrollRecord.findMany({
      where: {
        status: "PENDING",
        dj: {
          employmentType: {
            in: ["PART_TIME_W2", "FULL_TIME_W2"],
          },
        },
      },
      include: {
        dj: {
          select: {
            stageName: true,
          },
        },
      },
    });

    // Get equipment usage statistics
    const equipmentStats = await prisma.equipmentAssignment.groupBy({
      by: ["djId"],
      where: {
        returnedDate: null,
        dj: {
          employmentType: {
            in: ["PART_TIME_W2", "FULL_TIME_W2"],
          },
        },
      },
      _count: {
        id: true,
      },
    });

    // Get upcoming bookings for all employees
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        eventDate: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
        status: {
          in: ["ACCEPTED", "CONFIRMED"],
        },
        dj: {
          employmentType: {
            in: ["PART_TIME_W2", "FULL_TIME_W2"],
          },
        },
      },
      include: {
        dj: {
          select: {
            stageName: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        eventDate: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      employees: employeeStats,
      summary: {
        total: totalEmployees,
        active: activeEmployees,
        trained: trainedEmployees,
        monthlyRevenue: totalMonthlyRevenue,
        monthlyBookings: totalMonthlyBookings,
        averageRevenuePerEmployee: totalEmployees > 0 ? totalMonthlyRevenue / totalEmployees : 0,
        averageBookingsPerEmployee: totalEmployees > 0 ? totalMonthlyBookings / totalEmployees : 0,
      },
      pendingPayroll: pendingPayroll.map((payroll) => ({
        id: payroll.id,
        djName: payroll.dj.stageName,
        payPeriodStart: payroll.payPeriodStart,
        payPeriodEnd: payroll.payPeriodEnd,
        grossPay: payroll.grossPay,
        netPay: payroll.netPay,
      })),
      upcomingBookings: upcomingBookings.map((booking) => ({
        id: booking.id,
        djName: booking.dj?.stageName,
        clientName: booking.user.name,
        eventType: booking.eventType,
        eventDate: booking.eventDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
      })),
      equipmentUsage: equipmentStats,
    });
  } catch (error) {
    console.error("Error getting employee dashboard:", error);
    return NextResponse.json(
      { error: "Failed to get employee dashboard" },
      { status: 500 }
    );
  }
}
