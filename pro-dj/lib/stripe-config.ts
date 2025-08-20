import Stripe from "stripe";

// Professional Stripe configuration
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
  typescript: true,
  appInfo: {
    name: "Pro-DJ Booking Platform",
    version: "1.0.0",
    url: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  },
});

// Webhook configuration
export const webhookConfig = {
  endpointSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  tolerance: 300, // 5 minutes tolerance for webhook timing
};

// Business configuration for Stripe
export const businessConfig = {
  name: "Pro-DJ",
  description: "Professional DJ Booking Platform",
  statementDescriptor: "PRO-DJ BOOKING",
  statementDescriptorSuffix: "DJ Services",

  // Tax configuration
  taxBehavior: "exclusive" as const,

  // Business address (update with your actual business info)
  address: {
    line1: process.env.BUSINESS_ADDRESS_LINE1 || "123 Business St",
    city: process.env.BUSINESS_CITY || "Your City",
    state: process.env.BUSINESS_STATE || "Your State",
    postal_code: process.env.BUSINESS_POSTAL_CODE || "12345",
    country: process.env.BUSINESS_COUNTRY || "US",
  },

  // Contact information
  contact: {
    email: process.env.BUSINESS_EMAIL || "support@pro-dj.com",
    phone: process.env.BUSINESS_PHONE || "+1-555-123-4567",
  },
};

// Professional error handling
export class StripeError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "StripeError";
  }
}

export function handleStripeError(error: any): StripeError {
  if (error.type === "StripeCardError") {
    return new StripeError("Your card was declined.", "card_declined", 400);
  } else if (error.type === "StripeRateLimitError") {
    return new StripeError(
      "Too many requests made to the API too quickly.",
      "rate_limit",
      429
    );
  } else if (error.type === "StripeInvalidRequestError") {
    return new StripeError(
      "Invalid parameters were supplied to Stripe's API.",
      "invalid_request",
      400
    );
  } else if (error.type === "StripeAPIError") {
    return new StripeError(
      "An error occurred internally with Stripe's API.",
      "api_error",
      500
    );
  } else if (error.type === "StripeConnectionError") {
    return new StripeError(
      "Some kind of error occurred during the HTTPS communication.",
      "connection_error",
      500
    );
  } else if (error.type === "StripeAuthenticationError") {
    return new StripeError(
      "You probably used an incorrect API key.",
      "authentication_error",
      401
    );
  } else {
    return new StripeError("An unknown error occurred.", "unknown_error", 500);
  }
}

// Compliance configuration
export const complianceConfig = {
  // Terms of Service
  termsOfServiceUrl:
    process.env.TERMS_OF_SERVICE_URL || "https://pro-dj.com/terms",
  privacyPolicyUrl:
    process.env.PRIVACY_POLICY_URL || "https://pro-dj.com/privacy",

  // Refund policy
  refundPolicy: {
    allowed: true,
    timeframe: 7, // days
    conditions: [
      "Cancellation must be made 48 hours before event",
      "Partial refunds may apply",
    ],
  },

  // Tax compliance
  taxSettings: {
    automaticTax: true,
    taxBehavior: "exclusive",
    taxCode: "txcd_99999999", // Entertainment services
  },
};
