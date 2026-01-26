import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { ensureAllAdminDjsAreActive } from "@/lib/ensure-admin-dj-active";

export async function POST() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status || 400 });
  }

  try {
    const result = await ensureAllAdminDjsAreActive();
    return NextResponse.json({
      ok: true,
      message: `Ensured ${result.updated} of ${result.total} admin DJ profile(s) are ACTIVE`,
      ...result,
    });
  } catch (error) {
    console.error("Error ensuring admin DJs are active:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to ensure admin DJs are active" },
      { status: 500 },
    );
  }
}
