import { NextResponse } from "next/server";

// Instagram API route temporarily disabled until proper API integration
// All complex functionality is preserved in comments below for future use

/*
// Complex Instagram API functionality - commented out for now
// This includes:
// - Instagram API integration
// - Mock data generation
// - Pagination support
// - DJ profile integration
// - Social media analytics

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper function to generate realistic mock Instagram posts
function generateMockInstagramPosts(stageName: string, limit: number) {
  // Mock data generation logic would go here
  // This is preserved for when we re-enable Instagram features
}

export async function GET(req: Request) {
  // All the complex API logic would go here
  // This is preserved for when we re-enable Instagram features
}
*/

// Simple placeholder API route
export async function GET(req: Request) {
  return NextResponse.json(
    {
      ok: false,
      error: "Instagram integration is temporarily disabled",
      message:
        "This feature will be available once proper API integrations are implemented.",
    },
    { status: 503 }
  );
}
