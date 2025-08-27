import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { status, payDate, notes } = await request.json();

    if (!["PROCESSED", "PAID", "CANCELLED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be PROCESSED, PAID, or CANCELLED" },
        { status: 400 }
      );
    }

    // Get payroll record
    const payrollRecord = await prisma.payrollRecord.findUnique({
      where: { id },
      include: {
        dj: {
          select: {
            id: true,
            stageName: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!payrollRecord) {
      return NextResponse.json(
        { error: "Payroll record not found" },
        { status: 404 }
      );
    }

    // Update payroll record
    const updateData: any = {
      status,
      notes: notes || payrollRecord.notes,
    };

    if (status === "PAID" && payDate) {
      updateData.payDate = new Date(payDate);
    }

    const updatedRecord = await prisma.payrollRecord.update({
      where: { id },
      data: updateData,
    });

    // If marking as paid, update DJ's total events completed
    if (status === "PAID" && payrollRecord.status !== "PAID") {
      await prisma.djProfile.update({
        where: { id: payrollRecord.djId },
        data: {
          totalEventsCompleted: {
            increment: payrollRecord.eventsCompleted,
          },
          lastActiveDate: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Payroll ${status.toLowerCase()} successfully`,
      payroll: {
        id: updatedRecord.id,
        djId: updatedRecord.djId,
        stageName: payrollRecord.dj.stageName,
        status: updatedRecord.status,
        payDate: updatedRecord.payDate,
        grossPay: updatedRecord.grossPay,
        netPay: updatedRecord.netPay,
      },
    });
  } catch (error) {
    console.error("Error processing payroll:", error);
    return NextResponse.json(
      { error: "Failed to process payroll" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get detailed payroll record
    const payrollRecord = await prisma.payrollRecord.findUnique({
      where: { id },
      include: {
        dj: {
          select: {
            id: true,
            stageName: true,
            employmentType: true,
            hourlyRate: true,
            eventBonus: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!payrollRecord) {
      return NextResponse.json(
        { error: "Payroll record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payroll: {
        id: payrollRecord.id,
        dj: {
          id: payrollRecord.dj.id,
          stageName: payrollRecord.dj.stageName,
          name: payrollRecord.dj.user.name,
          email: payrollRecord.dj.user.email,
          employmentType: payrollRecord.dj.employmentType,
          hourlyRate: payrollRecord.dj.hourlyRate,
          eventBonus: payrollRecord.dj.eventBonus,
        },
        payPeriod: {
          start: payrollRecord.payPeriodStart,
          end: payrollRecord.payPeriodEnd,
        },
        work: {
          hoursWorked: payrollRecord.hoursWorked,
          eventsCompleted: payrollRecord.eventsCompleted,
          hourlyPay: payrollRecord.hourlyPay,
          eventBonuses: payrollRecord.eventBonuses,
        },
        gross: {
          grossPay: payrollRecord.grossPay,
        },
        employeeDeductions: {
          federalTax: payrollRecord.federalTax,
          stateTax: payrollRecord.stateTax,
          socialSecurity: payrollRecord.socialSecurity,
          medicare: payrollRecord.medicare,
        },
        employerTaxes: {
          employerSSN: payrollRecord.employerSSN,
          employerMedicare: payrollRecord.employerMedicare,
          employerFUTA: payrollRecord.employerFUTA,
          employerSUTA: payrollRecord.employerSUTA,
          workersComp: payrollRecord.workersComp,
          totalEmployerTax: payrollRecord.totalEmployerTax,
        },
        net: {
          netPay: payrollRecord.netPay,
        },
        status: payrollRecord.status,
        payDate: payrollRecord.payDate,
        notes: payrollRecord.notes,
        createdAt: payrollRecord.createdAt,
      },
    });
  } catch (error) {
    console.error("Error getting payroll details:", error);
    return NextResponse.json(
      { error: "Failed to get payroll details" },
      { status: 500 }
    );
  }
}
