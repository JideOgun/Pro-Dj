import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// PATCH - Update Pro-DJ add-on
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  try {
    const { id } = params;
    const {
      name,
      description,
      priceFixed,
      pricePerHour,
      category,
      requiresSpecialEquipment,
      isActive,
    } = await req.json();

    // Check if add-on exists
    const existingAddon = await prisma.proDjAddon.findUnique({
      where: { id },
    });

    if (!existingAddon) {
      return NextResponse.json({ error: "Add-on not found" }, { status: 404 });
    }

    // Validate category if provided
    if (category) {
      const validCategories = [
        "Lighting",
        "Sound",
        "MC Services",
        "Equipment",
        "Entertainment",
        "Special Effects",
        "Photography",
        "Videography",
      ];

      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: "Invalid category" },
          { status: 400 }
        );
      }
    }

    const updatedAddon = await prisma.proDjAddon.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(priceFixed !== undefined && { priceFixed }),
        ...(pricePerHour !== undefined && { pricePerHour }),
        ...(category && { category }),
        ...(requiresSpecialEquipment !== undefined && {
          requiresSpecialEquipment,
        }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      addon: updatedAddon,
    });
  } catch (error) {
    console.error("Error updating Pro-DJ add-on:", error);
    return NextResponse.json(
      { error: "Failed to update add-on" },
      { status: 500 }
    );
  }
}

// DELETE - Remove Pro-DJ add-on
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  try {
    const { id } = params;

    const addon = await prisma.proDjAddon.findUnique({
      where: { id },
    });

    if (!addon) {
      return NextResponse.json({ error: "Add-on not found" }, { status: 404 });
    }

    await prisma.proDjAddon.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Add-on deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting Pro-DJ add-on:", error);
    return NextResponse.json(
      { error: "Failed to delete add-on" },
      { status: 500 }
    );
  }
}
