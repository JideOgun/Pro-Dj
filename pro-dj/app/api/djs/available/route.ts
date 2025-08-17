import { NextResponse } from "next/server";
import { getAvailableDjs } from "@/lib/booking-utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");

    if (!startTime || !endTime) {
      return NextResponse.json(
        { ok: false, error: "startTime and endTime are required" },
        { status: 400 }
      );
    }

    const startDateTime = new Date(startTime);
    const endDateTime = new Date(endTime);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return NextResponse.json(
        { ok: false, error: "Invalid date format" },
        { status: 400 }
      );
    }

    const availableDjs = await getAvailableDjs(startDateTime, endDateTime);

    return NextResponse.json({ ok: true, data: availableDjs }, { status: 200 });
  } catch (error) {
    console.error("Error getting available DJs:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
