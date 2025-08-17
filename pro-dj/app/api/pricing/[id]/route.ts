import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gate = await requireAdmin();
  if (!gate.ok)
    return NextResponse.json(
      { ok: false, error: gate.error },
      { status: gate.status }
    );

  const body = await req.json().catch(() => null);
  if (!body || !Object.keys(body).length) {
    return NextResponse.json(
      { ok: false, error: "No Updates provided" },
      { status: 400 }
    );
  }

  // Only allow these fields to be updated
  const data: Record<string, unknown> = {};

  // Add allowed fields here
  if (typeof body.label === "string") data.label = body.label;
  if (typeof body.priceCents === "number") data.priceCents = body.priceCents;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;

  const updated = await prisma.pricing.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ok: true, data: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gate = await requireAdmin();
  if (!gate.ok)
    return NextResponse.json(
      { ok: false, error: gate.error },
      { status: gate.status }
    );

  try {
    // Check if package exists
    const packageToDelete = await prisma.pricing.findUnique({
      where: { id },
    });

    if (!packageToDelete) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Check if package is being used in any bookings
    const bookingsUsingPackage = await prisma.booking.findFirst({
      where: { packageKey: packageToDelete.key },
    });

    if (bookingsUsingPackage) {
      return NextResponse.json(
        {
          error:
            "Cannot delete package that is being used in existing bookings",
        },
        { status: 400 }
      );
    }

    // Delete the package
    await prisma.pricing.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting pricing package:", error);
    return NextResponse.json(
      { error: "Failed to delete package" },
      { status: 500 }
    );
  }
}
