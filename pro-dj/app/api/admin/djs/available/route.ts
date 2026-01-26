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
            role: true,
          },
        },
      },
      orderBy: {
        stageName: "asc",
      },
    });

    // Ensure admin DJs are always ACTIVE
    const djsWithActiveAdmins = await Promise.all(
      djs.map(async (dj) => {
        if (dj.user?.role === "ADMIN" && dj.user.status !== "ACTIVE") {
          await prisma.user.update({
            where: { id: dj.user.id || "" },
            data: { status: "ACTIVE" },
          });
          return { ...dj, user: { ...dj.user, status: "ACTIVE" as const } };
        }
        return dj;
      })
    );

    // Filter and format the DJs
    // Only include DJs where user.status is ACTIVE (or admin DJs which are always treated as active)
    const availableDjs = djsWithActiveAdmins
      .filter((dj) => dj.user?.status === "ACTIVE" || dj.user?.role === "ADMIN")
      .map((dj) => ({
        id: dj.id,
        stageName: dj.stageName,
        user: {
          name: dj.user.name,
          email: dj.user.email,
          role: dj.user.role,
          status: dj.user.status,
        },
        stripeConnectAccountEnabled: dj.stripeConnectAccountEnabled,
        // Include additional useful info for admin
        // Admin DJs are always considered active/ready
        isActive: dj.user?.status === "ACTIVE" || dj.user?.role === "ADMIN",
        hasStripeConnect: dj.stripeConnectAccountEnabled,
        isReady: dj.user?.status === "ACTIVE" || dj.user?.role === "ADMIN",
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
      { status: 500 },
    );
  }
}
