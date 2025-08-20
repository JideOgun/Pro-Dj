import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch a specific DJ's add-ons
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const djId = params.id;

    // Get DJ profile with add-ons
    const djProfile = await prisma.djProfile.findUnique({
      where: { id: djId },
      include: {
        djAddons: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!djProfile) {
      return NextResponse.json({ error: "DJ not found" }, { status: 404 });
    }

    // Return only active add-ons
    const activeAddons = djProfile.djAddons.map((addon) => ({
      addonKey: addon.addonKey,
      label: addon.label,
      description: addon.description,
      priceCents: addon.priceCents,
      isCustom: addon.isCustom,
      customCategory: addon.customCategory,
    }));

    return NextResponse.json({
      ok: true,
      addons: activeAddons,
    });
  } catch (error) {
    console.error("Error fetching DJ add-ons:", error);
    return NextResponse.json(
      { error: "Failed to fetch DJ add-ons" },
      { status: 500 }
    );
  }
}
