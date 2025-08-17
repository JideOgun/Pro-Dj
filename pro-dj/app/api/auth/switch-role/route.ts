import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check if user has admin privileges
    // Allow role switching if:
    // 1. Current role is ADMIN, OR
    // 2. User has admin email (jideogun93@gmail.com)
    const hasAdminAccess =
      session.user.role === "ADMIN" ||
      session.user.email === "jideogun93@gmail.com";

    if (!hasAdminAccess) {
      return NextResponse.json(
        { ok: false, error: "Only users with admin access can switch roles" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { newRole } = body;

    if (!newRole || !["ADMIN", "DJ", "CLIENT"].includes(newRole)) {
      return NextResponse.json(
        { ok: false, error: "Invalid role" },
        { status: 400 }
      );
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { role: newRole },
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Role switch error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to switch role" },
      { status: 500 }
    );
  }
}
