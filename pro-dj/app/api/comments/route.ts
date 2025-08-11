import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET() {
  // admin-only moderation list (later)
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok:false, error:gate.error }, { status:gate.status });
  return NextResponse.json({ ok:true, data:[], note:"GET /comments stub" });
}

export async function POST() {
  // public: add a comment (later we’ll require auth)
  return NextResponse.json({ ok:true, note:"POST /comments stub" }, { status:201 });
}
