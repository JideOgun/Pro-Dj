import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test basic database connection
    const userCount = await prisma.user.count();
    
    return NextResponse.json({ 
      ok: true, 
      message: "Database connection successful",
      userCount 
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

