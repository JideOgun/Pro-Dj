import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok:false, error: gate.error }, { status: gate.status });

  const updated = await prisma.booking.update({
    where: { id: params.id },
    data: { status: "DECLINED" },
  });

  // TODO send polite decline email
  return NextResponse.json({ ok:true, data: updated }, { status: 200 });
}
