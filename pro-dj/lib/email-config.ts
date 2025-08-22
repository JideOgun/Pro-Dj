// Email Configuration
export const EMAIL_CONFIG = {
  // SMTP Configuration
  SMTP: {
    HOST: process.env.SMTP_HOST || "smtp.gmail.com",
    PORT: parseInt(process.env.SMTP_PORT || "587"),
    USER: process.env.SMTP_USER || "",
    PASS: process.env.SMTP_PASS || "",
    SECURE: process.env.SMTP_SECURE === "true",
  },

  // Resend Configuration (alternative to SMTP)
  RESEND: {
    API_KEY: process.env.RESEND_API_KEY || "",
    FROM_EMAIL: process.env.RESEND_FROM_EMAIL || "prodj@bookprodj.com",
  },

  // App Configuration
  APP: {
    NAME: "Pro-DJ",
    URL: process.env.NEXT_PUBLIC_APP_URL || "https://bookprodj.com",
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || "jideogun93@gmail.com",
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || "jideogun93@gmail.com",
    FROM_NAME: "Pro-DJ Team",
    FROM_EMAIL: process.env.FROM_EMAIL || "jideogun93@gmail.com",
    BUSINESS_EIN: "39-3863295",
  },

  // Email Templates
  TEMPLATES: {
    // User Registration
    WELCOME: {
      subject: "Welcome to Pro-DJ!",
      template: "welcome",
    },

    // DJ Registration
    DJ_WELCOME: {
      subject: "Welcome to Pro-DJ - DJ Registration Complete",
      template: "dj-welcome",
    },

    // Booking Related
    BOOKING_REQUEST: {
      subject: "New Booking Request",
      template: "booking-request",
    },

    BOOKING_ACCEPTED: {
      subject: "Booking Accepted - Payment Required",
      template: "booking-accepted",
    },

    BOOKING_CONFIRMED: {
      subject: "Booking Confirmed - You're All Set!",
      template: "booking-confirmed",
    },

    BOOKING_CANCELLED: {
      subject: "Booking Cancelled",
      template: "booking-cancelled",
    },

    // Payment Related
    PAYMENT_RECEIVED: {
      subject: "Payment Received - Thank You!",
      template: "payment-received",
    },

    PAYMENT_FAILED: {
      subject: "Payment Failed - Action Required",
      template: "payment-failed",
    },

    // Account Related
    PASSWORD_RESET: {
      subject: "Password Reset Request",
      template: "password-reset",
    },

    ACCOUNT_ACTIVATED: {
      subject: "Account Activated",
      template: "account-activated",
    },

    ACCOUNT_SUSPENDED: {
      subject: "Account Suspended",
      template: "account-suspended",
    },

    // DJ Specific
    DJ_APPROVED: {
      subject: "DJ Profile Approved",
      template: "dj-approved",
    },

    DJ_REJECTED: {
      subject: "DJ Profile Review",
      template: "dj-rejected",
    },

    // Notifications
    NEW_FOLLOWER: {
      subject: "New Follower",
      template: "new-follower",
    },

    NEW_LIKE: {
      subject: "New Like on Your Mix",
      template: "new-like",
    },

    NEW_REPOST: {
      subject: "Your Mix Was Reposted",
      template: "new-repost",
    },

    // Security
    SECURITY_ALERT: {
      subject: "Security Alert",
      template: "security-alert",
    },

    LOGIN_ALERT: {
      subject: "New Login Detected",
      template: "login-alert",
    },
  },
};

// Email Provider Selection
export const EMAIL_PROVIDER = {
  SMTP: "smtp",
  RESEND: "resend",
  ETHEREAL: "ethereal", // For development/testing
} as const;

export type EmailProvider =
  (typeof EMAIL_PROVIDER)[keyof typeof EMAIL_PROVIDER];

// Get the configured email provider
export function getEmailProvider(): EmailProvider {
  if (process.env.EMAIL_PROVIDER === "resend" && EMAIL_CONFIG.RESEND.API_KEY) {
    return EMAIL_PROVIDER.RESEND;
  }

  if (process.env.EMAIL_PROVIDER === "smtp" && EMAIL_CONFIG.SMTP.USER) {
    return EMAIL_PROVIDER.SMTP;
  }

  // Default to SMTP for production
  return EMAIL_PROVIDER.SMTP;
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Email sanitization
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
