import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const types = await prisma.pricing.findMany({
    where: { isActive: true },
    distinct: ["type"],
    select: { type: true },
    orderBy: { type: "asc" },
  });
  return NextResponse.json({ ok: true, data: types.map(t => t.type) }, { status: 200 });
}
