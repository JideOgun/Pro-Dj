import Stripe from "stripe";

// Professional Stripe configuration - only initialize if secret key is available
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(
      process.env.STRIPE_SECRET_KEY.replace(/"/g, ""),
      {
        apiVersion: "2025-07-30.basil",
        typescript: true,
        appInfo: {
          name: "Pro-DJ Booking Platform",
          version: "1.0.0",
          url: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
        },
      }
    )
  : null;

// Webhook configuration
export const webhookConfig = {
  endpointSecret: process.env.STRIPE_WEBHOOK_SECRET?.replace(/"/g, "")!,
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

// Production security configuration
export const securityConfig = {
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
  },

  // Fraud prevention
  fraudPrevention: {
    enableRadar: true, // Enable Stripe Radar
    blockSuspiciousIPs: true,
    requireBillingAddress: true,
    requireShippingAddress: false, // Not needed for services
  },

  // Webhook security
  webhookSecurity: {
    verifySignature: true,
    allowedIPs: [], // Stripe webhook IPs (optional)
    timeout: 30000, // 30 seconds
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
  refundPolicyUrl:
    process.env.REFUND_POLICY_URL || "https://pro-dj.com/refund-policy",

  // Refund policy
  refundPolicy: {
    timeLimit: 30, // days
    partialRefunds: true,
    automaticRefunds: false, // Manual review required
    refundReasons: [
      "requested_by_customer",
      "duplicate",
      "fraudulent",
      "expired_uncaptured_charge",
    ],
  },

  // Tax configuration
  taxConfig: {
    automaticTax: {
      enabled: true,
      liability: "account" as const, // or "self"
    },
    taxBehavior: "exclusive" as const,
    taxCode: "txcd_99999999", // General tax code
  },

  // Legal requirements
  legalRequirements: {
    requireTermsAcceptance: true,
    requirePrivacyPolicy: true,
    requireRefundPolicy: true,
    requireBusinessLicense: true,
    requireTaxID: true,
  },
};

// Production monitoring configuration
export const monitoringConfig = {
  // Logging
  logging: {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    includeSensitiveData: false,
    logWebhooks: true,
    logPayments: true,
    logRefunds: true,
    logDisputes: true,
  },

  // Alerts
  alerts: {
    paymentFailures: true,
    webhookFailures: true,
    refundRequests: true,
    disputeAlerts: true,
    highChargebackRate: true,
  },

  // Metrics
  metrics: {
    trackSuccessRate: true,
    trackConversionRate: true,
    trackAverageOrderValue: true,
    trackRefundRate: true,
    trackChargebackRate: true,
  },
};

// Payment method configuration
export const paymentMethodConfig = {
  // Supported payment methods
  supportedMethods: [
    "card",
    "link", // Stripe Link
    "apple_pay",
    "google_pay",
  ],

  // Card configuration
  cardConfig: {
    requireCVC: true,
    requirePostalCode: true,
    allowSaveCard: true,
    saveCardDefault: false,
  },

  // Currency configuration
  currency: "usd",
  supportedCurrencies: ["usd", "cad", "eur", "gbp"],

  // Payment flow configuration
  paymentFlow: {
    mode: "payment" as const, // or "subscription"
    captureMethod: "automatic" as const,
    confirmationMethod: "automatic" as const,
    setupFutureUsage: "off_session" as const,
  },
};

// Validation utilities
export function validateStripeEvent(event: Stripe.Event): boolean {
  // Validate event structure
  if (!event.id || !event.type || !event.data) {
    return false;
  }

  // Validate event type
  const validEventTypes = [
    "checkout.session.completed",
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "refund.created",
    "charge.dispute.created",
    "charge.dispute.closed",
  ];

  return validEventTypes.includes(event.type);
}

export function validatePaymentAmount(amount: number): boolean {
  // Minimum payment amount (in cents)
  const minAmount = 100; // $1.00
  const maxAmount = 1000000; // $10,000.00

  return amount >= minAmount && amount <= maxAmount;
}

export function sanitizeStripeData(data: any): any {
  // Remove sensitive data for logging
  const sanitized = { ...data };

  if (sanitized.card) {
    delete sanitized.card.number;
    delete sanitized.card.cvc;
  }

  if (sanitized.billing_details) {
    delete sanitized.billing_details.name;
    delete sanitized.billing_details.email;
    delete sanitized.billing_details.phone;
  }

  return sanitized;
}
