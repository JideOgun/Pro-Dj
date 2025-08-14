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
