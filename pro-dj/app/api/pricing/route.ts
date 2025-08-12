import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") || "").trim();;

  if (!type) {
    return NextResponse.json(
      { ok: false, error: "Missing Type" },
      { status: 400 }
    );
  }

  const rows = await prisma.pricing.findMany({
    where: { type, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, key: true, label: true, priceCents: true },
  });
  return NextResponse.json({ ok: true, data: rows }, { status: 200 });
}
