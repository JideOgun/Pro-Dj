import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AVAILABLE_ADDONS, type AddonType } from "@/lib/booking-config";

// GET - Fetch DJ's add-ons
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get DJ profile
    const djProfile = await prisma.djProfile.findUnique({
      where: { userId: session.user.id },
      include: { djAddons: true },
    });

    if (!djProfile) {
      return NextResponse.json(
        { error: "DJ profile not found" },
        { status: 404 }
      );
    }

    // Get all available addon keys
    const availableAddonKeys = AVAILABLE_ADDONS.map((addon) => addon.key);

    // Create a map of existing add-ons
    const existingAddons = new Map(
      djProfile.djAddons.map((addon) => [addon.addonKey, addon])
    );

    // Create response with all available add-ons, marking which ones the DJ has
    const addonsWithStatus = availableAddonKeys.map((addonKey) => {
      const existing = existingAddons.get(addonKey);
      const defaultAddon = AVAILABLE_ADDONS.find((a) => a.key === addonKey);

      return {
        addonKey,
        label: existing?.label || defaultAddon?.label || addonKey,
        description: existing?.description || defaultAddon?.description || "",
        priceCents: existing?.priceCents || defaultAddon?.priceCents || 0,
        isActive: existing?.isActive ?? false,
        isCustom: existing?.isCustom || false,
        customCategory: existing?.customCategory || null,
      };
    });

    // Add custom add-ons that aren't in the standard list
    const customAddons = djProfile.djAddons.filter((addon) => addon.isCustom);
    const allAddons = [...addonsWithStatus, ...customAddons];

    return NextResponse.json({
      ok: true,
      addons: allAddons,
      availableAddonKeys,
    });
  } catch (error) {
    console.error("Error fetching DJ add-ons:", error);
    return NextResponse.json(
      { error: "Failed to fetch add-ons" },
      { status: 500 }
    );
  }
}

// POST - Create or update DJ add-on
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      addonKey,
      label,
      description,
      priceCents,
      isActive,
      isCustom,
      customCategory,
    } = body;

    // Validate required fields
    if (!addonKey || !label || typeof priceCents !== "number") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
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

    // Check if addon already exists
    const existingAddon = await prisma.djAddon.findUnique({
      where: {
        djId_addonKey: {
          djId: djProfile.id,
          addonKey,
        },
      },
    });

    let addon;
    if (existingAddon) {
      // Update existing addon
      addon = await prisma.djAddon.update({
        where: { id: existingAddon.id },
        data: {
          label,
          description,
          priceCents,
          isActive,
          isCustom: isCustom || false,
          customCategory,
        },
      });
    } else {
      // Create new addon
      addon = await prisma.djAddon.create({
        data: {
          djId: djProfile.id,
          addonKey,
          label,
          description,
          priceCents,
          isActive,
          isCustom: isCustom || false,
          customCategory,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      addon,
    });
  } catch (error) {
    console.error("Error creating/updating DJ add-on:", error);
    return NextResponse.json(
      { error: "Failed to save add-on" },
      { status: 500 }
    );
  }
}

// DELETE - Remove DJ add-on
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const addonKey = searchParams.get("addonKey");

    if (!addonKey) {
      return NextResponse.json(
        { error: "Addon key is required" },
        { status: 400 }
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

    // Find and delete the addon
    const addon = await prisma.djAddon.findUnique({
      where: {
        djId_addonKey: {
          djId: djProfile.id,
          addonKey,
        },
      },
    });

    if (!addon) {
      return NextResponse.json({ error: "Addon not found" }, { status: 404 });
    }

    await prisma.djAddon.delete({
      where: { id: addon.id },
    });

    return NextResponse.json({
      ok: true,
      message: "Addon deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting DJ add-on:", error);
    return NextResponse.json(
      { error: "Failed to delete add-on" },
      { status: 500 }
    );
  }
}
