import { NextResponse } from "next/server";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export class ApiError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || this.getDefaultCode(statusCode);
    this.name = "ApiError";
  }

  private getDefaultCode(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return "BAD_REQUEST";
      case 401:
        return "UNAUTHORIZED";
      case 403:
        return "FORBIDDEN";
      case 404:
        return "NOT_FOUND";
      case 409:
        return "CONFLICT";
      case 422:
        return "VALIDATION_ERROR";
      case 429:
        return "RATE_LIMITED";
      case 500:
        return "INTERNAL_SERVER_ERROR";
      default:
        return "UNKNOWN_ERROR";
    }
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error);

  // If it's our custom ApiError
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
      },
      { status: error.statusCode }
    );
  }

  // If it's a Prisma error
  if (error && typeof error === "object" && "code" in error) {
    const prismaError = error as any;

    switch (prismaError.code) {
      case "P2002":
        return NextResponse.json(
          {
            error: "A record with this information already exists",
            code: "DUPLICATE_ENTRY",
            statusCode: 409,
          },
          { status: 409 }
        );
      case "P2025":
        return NextResponse.json(
          {
            error: "Record not found",
            code: "NOT_FOUND",
            statusCode: 404,
          },
          { status: 404 }
        );
      default:
        return NextResponse.json(
          {
            error: "Database operation failed",
            code: "DATABASE_ERROR",
            statusCode: 500,
          },
          { status: 500 }
        );
    }
  }

  // If it's a Stripe error
  if (error && typeof error === "object" && "type" in error) {
    const stripeError = error as any;
    return NextResponse.json(
      {
        error: stripeError.message || "Payment processing failed",
        code: "PAYMENT_ERROR",
        statusCode: 400,
      },
      { status: 400 }
    );
  }

  // Generic error
  return NextResponse.json(
    {
      error: "An unexpected error occurred",
      code: "INTERNAL_SERVER_ERROR",
      statusCode: 500,
    },
    { status: 500 }
  );
}

// Helper functions for common errors
export const ApiErrors = {
  unauthorized: (message: string = "Authentication required") =>
    new ApiError(message, 401),

  forbidden: (message: string = "Access denied") => new ApiError(message, 403),

  notFound: (message: string = "Resource not found") =>
    new ApiError(message, 404),

  badRequest: (message: string = "Invalid request") =>
    new ApiError(message, 400),

  conflict: (message: string = "Resource conflict") =>
    new ApiError(message, 409),

  validationError: (message: string = "Validation failed") =>
    new ApiError(message, 422),

  rateLimited: (message: string = "Too many requests") =>
    new ApiError(message, 429),

  internalError: (message: string = "Internal server error") =>
    new ApiError(message, 500),
};
