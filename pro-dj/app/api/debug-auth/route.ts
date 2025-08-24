import { NextResponse } from "next/server";

export async function GET() {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasPrismaDatabaseUrl: !!process.env.PRISMA_DATABASE_URL,
    // Don't expose actual secrets, just check if they exist
    secretLength: process.env.NEXTAUTH_SECRET?.length || 0,
  };

  return NextResponse.json({
    ok: true,
    debug: debugInfo,
    message: "Auth debug information",
  });
}
