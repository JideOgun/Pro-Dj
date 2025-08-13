import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  email: z
    .string()
    .email()
    .transform((e) => e.toLowerCase().trim()),
  name: z.string().min(1).max(80),
  password: z.string().min(8, "Password must be at least 8 characters"),
  // Optional role override if you want to allow DJ signups later:
  // role: z.enum(["CLIENT","DJ","ADMIN"]).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const { email, name, password } = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Email already registered" },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hash,
        role: "CLIENT",
      },
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "name" in err &&
      err.name === "ZodError"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            (err as { issues?: Array<{ message: string }> }).issues?.[0]
              ?.message ?? "Invalid input",
        },
        { status: 400 }
      );
    }
    // Prisma unique guard (extra safety)
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { ok: false, error: "Email already registered" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
