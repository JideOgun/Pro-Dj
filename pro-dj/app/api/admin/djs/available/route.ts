import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok)
    return NextResponse.json({ ok: false, error: gate.error }, { status: 400 });

  try {
    // Get all DJs with their user information
    const djs = await prisma.djProfile.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            status: true,
          },
        },
      },
      orderBy: {
        stageName: "asc",
      },
    });

    // Filter and format the DJs
    const availableDjs = djs.map((dj) => ({
      id: dj.id,
      stageName: dj.stageName,
      user: {
        name: dj.user.name,
        email: dj.user.email,
      },
      contractorStatus: dj.contractorStatus,
      stripeConnectAccountEnabled: dj.stripeConnectAccountEnabled,
      // Include additional useful info for admin
      isActive: dj.contractorStatus === "ACTIVE",
      hasStripeConnect: dj.stripeConnectAccountEnabled,
      isReady: dj.contractorStatus === "ACTIVE", // Stripe Connect no longer required
    }));

    return NextResponse.json({
      ok: true,
      djs: availableDjs,
      total: availableDjs.length,
      active: availableDjs.filter((dj) => dj.isActive).length,
      ready: availableDjs.filter((dj) => dj.isReady).length,
    });
  } catch (error) {
    console.error("Error fetching available DJs:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch DJs" },
      { status: 500 }
    );
  }
}
