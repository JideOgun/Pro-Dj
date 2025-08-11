import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok)
    return NextResponse.json(
      { ok: false, error: gate.error },
      { status: gate.status }
    );
  return NextResponse.json(
    { ok: true, data: [], note: "GET /mixes stub" },
    { status: 201 }
  );
}
