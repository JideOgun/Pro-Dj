import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Tax rates for 2024 (approximate - should be configurable)
const TAX_RATES = {
  FEDERAL_INCOME: 0.12, // Approximate for part-time wages
  STATE_INCOME: 0.05, // Varies by state - should be configurable
  SOCIAL_SECURITY_EMPLOYEE: 0.062,
  MEDICARE_EMPLOYEE: 0.0145,
  SOCIAL_SECURITY_EMPLOYER: 0.062,
  MEDICARE_EMPLOYER: 0.0145,
  FUTA: 0.006, // Federal unemployment (employer only)
  SUTA: 0.025, // State unemployment (employer only, varies by state)
  WORKERS_COMP: 0.02, // Approximate for entertainment industry
};

function calculatePayroll(
  hoursWorked: number,
  eventsCompleted: number,
  hourlyRate: number,
  eventBonus: number
) {
  const hourlyPay = hoursWorked * hourlyRate;
  const eventBonuses = eventsCompleted * eventBonus;
  const grossPay = hourlyPay + eventBonuses;

  // Employee tax withholdings
  const federalTax = grossPay * TAX_RATES.FEDERAL_INCOME;
  const stateTax = grossPay * TAX_RATES.STATE_INCOME;
  const socialSecurity = grossPay * TAX_RATES.SOCIAL_SECURITY_EMPLOYEE;
  const medicare = grossPay * TAX_RATES.MEDICARE_EMPLOYEE;

  // Employer taxes
  const employerSSN = grossPay * TAX_RATES.SOCIAL_SECURITY_EMPLOYER;
  const employerMedicare = grossPay * TAX_RATES.MEDICARE_EMPLOYER;
  const employerFUTA = Math.min(grossPay * TAX_RATES.FUTA, 42); // FUTA cap
  const employerSUTA = grossPay * TAX_RATES.SUTA;
  const workersComp = grossPay * TAX_RATES.WORKERS_COMP;

  const totalEmployerTax = employerSSN + employerMedicare + employerFUTA + employerSUTA + workersComp;
  const netPay = grossPay - federalTax - stateTax - socialSecurity - medicare;

  return {
    hourlyPay,
    eventBonuses,
    grossPay,
    federalTax,
    stateTax,
    socialSecurity,
    medicare,
    employerSSN,
    employerMedicare,
    employerFUTA,
    employerSUTA,
    workersComp,
    totalEmployerTax,
    netPay,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const {
      djId,
      payPeriodStart,
      payPeriodEnd,
      hoursWorked,
      eventsCompleted = 0,
    } = await request.json();

    if (!djId || !payPeriodStart || !payPeriodEnd || hoursWorked === undefined) {
      return NextResponse.json(
        { error: "DJ ID, pay period, and hours worked are required" },
        { status: 400 }
      );
    }

    // Get employee details
    const djProfile = await prisma.djProfile.findUnique({
      where: { id: djId },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!djProfile) {
      return NextResponse.json(
        { error: "DJ not found" },
        { status: 404 }
      );
    }

    if (!["PART_TIME_W2", "FULL_TIME_W2"].includes(djProfile.employmentType)) {
      return NextResponse.json(
        { error: "DJ is not an employee" },
        { status: 400 }
      );
    }

    if (!djProfile.hourlyRate || !djProfile.eventBonus) {
      return NextResponse.json(
        { error: "Employee hourly rate and event bonus not configured" },
        { status: 400 }
      );
    }

    // Check for existing payroll record
    const existingPayroll = await prisma.payrollRecord.findFirst({
      where: {
        djId,
        payPeriodStart: new Date(payPeriodStart),
        payPeriodEnd: new Date(payPeriodEnd),
      },
    });

    if (existingPayroll) {
      return NextResponse.json(
        { error: "Payroll record already exists for this period" },
        { status: 400 }
      );
    }

    // Calculate payroll
    const calculations = calculatePayroll(
      parseFloat(hoursWorked.toString()),
      parseInt(eventsCompleted.toString()),
      parseFloat(djProfile.hourlyRate.toString()),
      parseFloat(djProfile.eventBonus.toString())
    );

    // Create payroll record
    const payrollRecord = await prisma.payrollRecord.create({
      data: {
        djId,
        payPeriodStart: new Date(payPeriodStart),
        payPeriodEnd: new Date(payPeriodEnd),
        hoursWorked: parseFloat(hoursWorked.toString()),
        eventsCompleted: parseInt(eventsCompleted.toString()),
        hourlyPay: calculations.hourlyPay,
        eventBonuses: calculations.eventBonuses,
        grossPay: calculations.grossPay,
        federalTax: calculations.federalTax,
        stateTax: calculations.stateTax,
        socialSecurity: calculations.socialSecurity,
        medicare: calculations.medicare,
        employerSSN: calculations.employerSSN,
        employerMedicare: calculations.employerMedicare,
        employerFUTA: calculations.employerFUTA,
        employerSUTA: calculations.employerSUTA,
        workersComp: calculations.workersComp,
        totalEmployerTax: calculations.totalEmployerTax,
        netPay: calculations.netPay,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payroll calculated successfully",
      payroll: {
        id: payrollRecord.id,
        djId: payrollRecord.djId,
        stageName: djProfile.stageName,
        payPeriodStart: payrollRecord.payPeriodStart,
        payPeriodEnd: payrollRecord.payPeriodEnd,
        hoursWorked: payrollRecord.hoursWorked,
        eventsCompleted: payrollRecord.eventsCompleted,
        grossPay: payrollRecord.grossPay,
        netPay: payrollRecord.netPay,
        totalEmployerTax: payrollRecord.totalEmployerTax,
        status: payrollRecord.status,
      },
      calculations,
    });
  } catch (error) {
    console.error("Error calculating payroll:", error);
    return NextResponse.json(
      { error: "Failed to calculate payroll" },
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

    const { searchParams } = new URL(request.url);
    const djId = searchParams.get("djId");
    const status = searchParams.get("status");

    // Build filter conditions
    const where: any = {};
    if (djId) where.djId = djId;
    if (status) where.status = status;

    // Get payroll records
    const payrollRecords = await prisma.payrollRecord.findMany({
      where,
      include: {
        dj: {
          select: {
            stageName: true,
            user: { select: { email: true } },
          },
        },
      },
      orderBy: { payPeriodStart: "desc" },
      take: 50, // Limit results
    });

    // Get summary statistics
    const totalGrossPay = await prisma.payrollRecord.aggregate({
      where,
      _sum: {
        grossPay: true,
        totalEmployerTax: true,
      },
    });

    return NextResponse.json({
      success: true,
      payrollRecords: payrollRecords.map((record) => ({
        id: record.id,
        djId: record.djId,
        stageName: record.dj.stageName,
        email: record.dj.user.email,
        payPeriodStart: record.payPeriodStart,
        payPeriodEnd: record.payPeriodEnd,
        hoursWorked: record.hoursWorked,
        eventsCompleted: record.eventsCompleted,
        grossPay: record.grossPay,
        netPay: record.netPay,
        totalEmployerTax: record.totalEmployerTax,
        status: record.status,
        payDate: record.payDate,
      })),
      summary: {
        totalGrossPay: totalGrossPay._sum.grossPay || 0,
        totalEmployerTax: totalGrossPay._sum.totalEmployerTax || 0,
        recordCount: payrollRecords.length,
      },
    });
  } catch (error) {
    console.error("Error getting payroll records:", error);
    return NextResponse.json(
      { error: "Failed to get payroll records" },
      { status: 500 }
    );
  }
}
