import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  encryptTaxId,
  getTaxIdLastFour,
  determineTaxIdType,
} from "@/lib/security-utils";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role !== "DJ" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only DJs and admins can access this endpoint" },
        { status: 403 }
      );
    }

    const { taxId, businessName, businessAddress, businessPhone } =
      await request.json();

    // Validate required fields
    if (!taxId || taxId.replace(/\D/g, "").length !== 9) {
      return NextResponse.json(
        {
          error:
            "Valid tax ID (SSN or EIN) is required for subcontractor payments",
        },
        { status: 400 }
      );
    }

    // Get or create user's business type from SecurityClearance
    let securityClearance = await prisma.securityClearance.findUnique({
      where: { userId: session.user.id },
      select: { isCorporation: true, isSoleProprietor: true },
    });

    // If no security clearance exists, create one with default values
    if (!securityClearance) {
      securityClearance = await prisma.securityClearance.create({
        data: {
          userId: session.user.id,
          isCorporation: false,
          isSoleProprietor: true,
        },
        select: { isCorporation: true, isSoleProprietor: true },
      });
    }

    const isCorporation = securityClearance.isCorporation;
    const isSoleProprietor = securityClearance.isSoleProprietor;

    // Validate corporation-specific fields
    if (isCorporation) {
      if (!businessName?.trim()) {
        return NextResponse.json(
          { error: "Business name is required for corporations" },
          { status: 400 }
        );
      }
      if (!businessAddress?.trim()) {
        return NextResponse.json(
          { error: "Business address is required for corporations" },
          { status: 400 }
        );
      }
      if (
        !businessPhone?.trim() ||
        businessPhone.replace(/\D/g, "").length !== 10
      ) {
        return NextResponse.json(
          { error: "Valid business phone number is required for corporations" },
          { status: 400 }
        );
      }
    }

    // Encrypt tax ID
    const { encrypted, iv, tag } = encryptTaxId(taxId);
    const encryptedTaxId = `${encrypted}:${iv}:${tag}`;
    const taxIdLastFour = getTaxIdLastFour(taxId);
    const taxIdType = determineTaxIdType(taxId);

    // Update SecurityClearance with tax information
    const updatedSecurityClearance = await prisma.securityClearance.upsert({
      where: { userId: session.user.id },
      update: {
        encryptedTaxId,
        taxIdLastFour,
        taxIdType,
        businessName: isCorporation ? businessName : null,
        businessAddress: isCorporation ? businessAddress : null,
        businessPhone: isCorporation ? businessPhone : null,
        isCorporation,
        isSoleProprietor,
      },
      create: {
        userId: session.user.id,
        encryptedTaxId,
        taxIdLastFour,
        taxIdType,
        businessName: isCorporation ? businessName : null,
        businessAddress: isCorporation ? businessAddress : null,
        businessPhone: isCorporation ? businessPhone : null,
        isCorporation,
        isSoleProprietor,
      },
      select: {
        id: true,
        userId: true,
        taxIdLastFour: true,
        taxIdType: true,
        businessName: true,
        isCorporation: true,
        isSoleProprietor: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment setup completed successfully",
      user: updatedSecurityClearance,
    });
  } catch (error) {
    console.error("Payment setup error:", error);
    return NextResponse.json(
      { error: "Failed to complete payment setup" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role !== "DJ" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only DJs and admins can access this endpoint" },
        { status: 403 }
      );
    }

    // Check if user has completed payment setup
    const securityClearance = await prisma.securityClearance.findUnique({
      where: { userId: session.user.id },
      select: {
        encryptedTaxId: true,
        taxIdLastFour: true,
        taxIdType: true,
        businessName: true,
        businessAddress: true,
        businessPhone: true,
        isCorporation: true,
        isSoleProprietor: true,
      },
    });

    // Check Stripe Connect status
    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        stripeConnectAccountId: true,
        stripeConnectAccountEnabled: true,
        stripeConnectAccountStatus: true,
      },
    });

    const hasCompletedTaxSetup = !!securityClearance?.encryptedTaxId;
    const hasCompletedStripeSetup =
      !!djProfile?.stripeConnectAccountId &&
      djProfile.stripeConnectAccountEnabled;
    const hasCompletedSetup = hasCompletedTaxSetup && hasCompletedStripeSetup;

    return NextResponse.json({
      hasCompletedSetup,
      hasCompletedTaxSetup,
      hasCompletedStripeSetup,
      taxIdLastFour: hasCompletedTaxSetup
        ? securityClearance.taxIdLastFour
        : null,
      taxIdType: hasCompletedTaxSetup ? securityClearance.taxIdType : null,
      businessName: hasCompletedTaxSetup
        ? securityClearance.businessName
        : null,
      isCorporation: securityClearance?.isCorporation || false,
      isSoleProprietor: securityClearance?.isSoleProprietor || false,
      stripeConnectStatus: djProfile?.stripeConnectAccountStatus || null,
    });
  } catch (error) {
    console.error("Payment setup status check error:", error);
    return NextResponse.json(
      { error: "Failed to check payment setup status" },
      { status: 500 }
    );
  }
}
