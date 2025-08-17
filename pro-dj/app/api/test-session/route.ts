import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("Test session endpoint called");
    console.log(
      "Request headers:",
      Object.fromEntries(request.headers.entries())
    );

    const session = await getServerSession(authOptions);
    console.log("Session result:", session);

    if (!session) {
      return NextResponse.json({
        ok: false,
        message: "No session found",
        headers: Object.fromEntries(request.headers.entries()),
        cookies: request.cookies.getAll(),
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Session found",
      session: {
        user: {
          id: session.user?.id,
          email: session.user?.email,
          role: session.user?.role,
          name: session.user?.name,
        },
        expires: session.expires,
      },
    });
  } catch (error) {
    console.error("Error in test session:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to get session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

