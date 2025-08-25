import { NextRequest, NextResponse } from "next/server";
import { processExpiredPendingBookings } from "@/lib/booking-timeout";

// This endpoint can be called by external cron services (Vercel Cron, GitHub Actions, etc.)
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from an authorized source
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🕐 Cron job: Processing expired bookings...");

    // Process expired pending bookings
    await processExpiredPendingBookings();

    console.log("✅ Cron job: Timeout processing completed");

    return NextResponse.json({
      success: true,
      message: "Timeout processing completed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Cron job error:", error);
    return NextResponse.json(
      { error: "Failed to process timeouts" },
      { status: 500 }
    );
  }
}

// GET endpoint for health checks
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "booking-timeout-processor",
    timestamp: new Date().toISOString(),
  });
}
