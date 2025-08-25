import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// Initialize Stripe
let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-07-30.basil",
    });
  }
} catch (error) {
  console.error("Failed to initialize Stripe:", error);
  stripe = null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only DJs can create Connect accounts
    if (session.user.role !== "DJ") {
      return NextResponse.json(
        { error: "Only DJs can create Connect accounts" },
        { status: 403 }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    // Get DJ profile
    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!djProfile) {
      return NextResponse.json(
        { error: "DJ profile not found" },
        { status: 404 }
      );
    }

    // Check if Connect account already exists
    if (djProfile.stripeConnectAccountId) {
      return NextResponse.json(
        { error: "Connect account already exists" },
        { status: 400 }
      );
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: "express",
      country: "US", // Default to US, can be made configurable
      email: session.user.email,
      business_type: "individual",
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      business_profile: {
        name: djProfile.stageName,
        url: process.env.NEXTAUTH_URL,
        mcc: "5815", // Entertainment - DJs
      },
      individual: {
        email: session.user.email,
        first_name: session.user.name?.split(" ")[0] || "",
        last_name: session.user.name?.split(" ").slice(1).join(" ") || "",
      },
    });

    // Update DJ profile with Connect account info
    await prisma.djProfile.update({
      where: { id: djProfile.id },
      data: {
        stripeConnectAccountId: account.id,
        stripeConnectAccountStatus: account.charges_enabled ? "active" : "pending",
        stripeConnectAccountEnabled: account.charges_enabled,
        stripeConnectAccountCreatedAt: new Date(),
      },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXTAUTH_URL}/dashboard/dj/connect/refresh`,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard/dj/connect/success`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      success: true,
      accountId: account.id,
      accountLink: accountLink.url,
      status: account.charges_enabled ? "active" : "pending",
    });
  } catch (error) {
    console.error("Error creating Connect account:", error);
    return NextResponse.json(
      { error: "Failed to create Connect account" },
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

    // Get DJ profile
    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        stripeConnectAccountId: true,
        stripeConnectAccountStatus: true,
        stripeConnectAccountEnabled: true,
        stripeConnectAccountCreatedAt: true,
      },
    });

    if (!djProfile) {
      return NextResponse.json(
        { error: "DJ profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      connectAccount: {
        id: djProfile.stripeConnectAccountId,
        status: djProfile.stripeConnectAccountStatus,
        enabled: djProfile.stripeConnectAccountEnabled,
        createdAt: djProfile.stripeConnectAccountCreatedAt,
      },
    });
  } catch (error) {
    console.error("Error getting Connect account:", error);
    return NextResponse.json(
      { error: "Failed to get Connect account" },
      { status: 500 }
    );
  }
}
