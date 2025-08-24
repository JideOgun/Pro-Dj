import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter (consider Redis for production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function rateLimit(config: RateLimitConfig) {
  return function (request: NextRequest) {
    const ip =
      request.ip || request.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Clean up old entries
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < windowStart) {
        rateLimitMap.delete(key);
      }
    }

    const key = `${ip}:${request.nextUrl.pathname}`;
    const current = rateLimitMap.get(key);

    if (!current || current.resetTime < windowStart) {
      // First request in window
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now,
      });
      return null; // Allow request
    }

    if (current.count >= config.maxRequests) {
      // Rate limit exceeded
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Increment count
    current.count++;
    return null; // Allow request
  };
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  upload: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 requests per minute
  api: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  subscription: { maxRequests: 3, windowMs: 5 * 60 * 1000 }, // 3 requests per 5 minutes
};
