import { Resend } from "resend";
import nodemailer from "nodemailer";
import {
  EMAIL_CONFIG,
  getEmailProvider,
  EMAIL_PROVIDER,
  isValidEmail,
  sanitizeEmail,
} from "./email-config";

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

// Initialize Resend
const resend = EMAIL_CONFIG.RESEND.API_KEY
  ? new Resend(EMAIL_CONFIG.RESEND.API_KEY)
  : null;

async function getTransporter() {
  const provider = getEmailProvider();

  if (provider === EMAIL_PROVIDER.SMTP) {
    return nodemailer.createTransport({
      host: EMAIL_CONFIG.SMTP.HOST,
      port: EMAIL_CONFIG.SMTP.PORT,
      secure: EMAIL_CONFIG.SMTP.SECURE,
      auth: {
        user: EMAIL_CONFIG.SMTP.USER,
        pass: EMAIL_CONFIG.SMTP.PASS,
      },
    });
  }

  if (provider === EMAIL_PROVIDER.RESEND) {
    // For Resend, we'll use their API directly
    return null;
  }

  // Ethereal for development/testing
  if (!transporterPromise) {
    transporterPromise = new Promise(async (resolve) => {
      const testAcc = await nodemailer.createTestAccount();
      const tr = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAcc.user,
          pass: testAcc.pass,
        },
      });
      console.log("📧 Ethereal account created:", testAcc.user, testAcc.pass);
      resolve(tr);
    });
  }
  return transporterPromise;
}

export async function sendMail(
  to: string,
  subject: string,
  html: string,
  options?: {
    from?: string;
    replyTo?: string;
    attachments?: Array<{
      filename: string;
      content: string | Buffer;
      contentType?: string;
    }>;
  }
) {
  // Validate and sanitize email
  if (!to || !isValidEmail(to)) {
    console.warn("📧 Invalid email address:", to);
    return { ok: false, error: "Invalid email address" };
  }

  const sanitizedTo = sanitizeEmail(to);
  const provider = getEmailProvider();

  try {
    if (provider === EMAIL_PROVIDER.RESEND && resend) {
      // Use Resend
      const result = await resend.emails.send({
        from:
          options?.from ||
          `"${EMAIL_CONFIG.APP.FROM_NAME}" <${EMAIL_CONFIG.RESEND.FROM_EMAIL}>`,
        to: sanitizedTo,
        subject,
        html,
        replyTo: options?.replyTo,
        attachments: options?.attachments,
      });

      if (result.error) {
        console.error("📧 Resend error:", result.error);
        return { ok: false, error: result.error };
      }

      console.log("📧 Email sent via Resend:", result.data?.id);
      return { ok: true, id: result.data?.id, provider: "resend" };
    }

    // Use SMTP or Ethereal
    const transporter = await getTransporter();
    if (!transporter) {
      return { ok: false, error: "No email provider configured" };
    }

    const info = await transporter.sendMail({
      from:
        options?.from ||
        `"${EMAIL_CONFIG.APP.FROM_NAME}" <${
          EMAIL_CONFIG.SMTP.USER || EMAIL_CONFIG.APP.FROM_EMAIL
        }>`,
      to: sanitizedTo,
      subject,
      html,
      replyTo: options?.replyTo,
      attachments: options?.attachments,
      headers: {
        "X-Entity-Ref-ID": "pro-dj-logo",
        "List-Unsubscribe": `<mailto:${EMAIL_CONFIG.APP.SUPPORT_EMAIL}?subject=unsubscribe>`,
      },
    });

    const preview = nodemailer.getTestMessageUrl?.(info);
    if (preview) {
      console.log("📧 Email preview:", preview);
    }

    console.log("📧 Email sent via SMTP:", info.messageId);
    return {
      ok: true,
      messageId: info.messageId,
      previewUrl: preview,
      provider: provider === EMAIL_PROVIDER.ETHEREAL ? "ethereal" : "smtp",
    };
  } catch (error) {
    console.error("📧 Email sending failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Email service with template support
export class EmailService {
  static async sendWelcomeEmail(userEmail: string, userName: string) {
    const { welcomeEmailTemplate } = await import("./email-templates");
    const html = welcomeEmailTemplate(userName);
    return sendMail(userEmail, EMAIL_CONFIG.TEMPLATES.WELCOME.subject, html);
  }

  static async sendDjWelcomeEmail(userEmail: string, stageName: string) {
    const { djWelcomeEmailTemplate } = await import("./email-templates");
    const html = djWelcomeEmailTemplate(stageName);
    return sendMail(userEmail, EMAIL_CONFIG.TEMPLATES.DJ_WELCOME.subject, html);
  }

  static async sendBookingRequestEmail(
    djEmail: string,
    djName: string,
    clientName: string,
    eventType: string,
    eventDate: string,
    eventTime: string,
    venue: string,
    guestCount: number
  ) {
    const { bookingRequestEmailTemplate } = await import("./email-templates");
    const html = bookingRequestEmailTemplate(
      djName,
      clientName,
      eventType,
      eventDate,
      eventTime,
      venue,
      guestCount
    );
    return sendMail(
      djEmail,
      EMAIL_CONFIG.TEMPLATES.BOOKING_REQUEST.subject,
      html
    );
  }

  static async sendBookingAcceptedEmail(
    clientEmail: string,
    clientName: string,
    djName: string,
    eventType: string,
    eventDate: string,
    payLink: string
  ) {
    const { bookingAcceptedEmailTemplate } = await import("./email-templates");
    const html = bookingAcceptedEmailTemplate(
      clientName,
      djName,
      eventType,
      eventDate,
      payLink
    );
    return sendMail(
      clientEmail,
      EMAIL_CONFIG.TEMPLATES.BOOKING_ACCEPTED.subject,
      html
    );
  }

  static async sendBookingConfirmedEmail(
    clientEmail: string,
    clientName: string,
    djName: string,
    eventType: string,
    eventDate: string,
    eventTime: string,
    venue: string
  ) {
    const { bookingConfirmedEmailTemplate } = await import("./email-templates");
    const html = bookingConfirmedEmailTemplate(
      clientName,
      djName,
      eventType,
      eventDate,
      eventTime,
      venue
    );
    return sendMail(
      clientEmail,
      EMAIL_CONFIG.TEMPLATES.BOOKING_CONFIRMED.subject,
      html
    );
  }

  static async sendPaymentReceivedEmail(
    userEmail: string,
    userName: string,
    amount: string,
    eventType: string,
    eventDate: string
  ) {
    const { paymentReceivedEmailTemplate } = await import("./email-templates");
    const html = paymentReceivedEmailTemplate(
      userName,
      amount,
      eventType,
      eventDate
    );
    return sendMail(
      userEmail,
      EMAIL_CONFIG.TEMPLATES.PAYMENT_RECEIVED.subject,
      html
    );
  }

  static async sendDjApprovedEmail(userEmail: string, stageName: string) {
    const { djApprovedEmailTemplate } = await import("./email-templates");
    const html = djApprovedEmailTemplate(stageName);
    return sendMail(
      userEmail,
      EMAIL_CONFIG.TEMPLATES.DJ_APPROVED.subject,
      html
    );
  }

  static async sendDjRejectedEmail(
    userEmail: string,
    stageName: string,
    reason: string,
    nextSteps: string
  ) {
    const { djRejectedEmailTemplate } = await import("./email-templates");
    const html = djRejectedEmailTemplate(stageName, reason, nextSteps);
    return sendMail(
      userEmail,
      EMAIL_CONFIG.TEMPLATES.DJ_REJECTED.subject,
      html
    );
  }

  static async sendPasswordResetEmail(
    userEmail: string,
    userName: string,
    resetLink: string
  ) {
    const { passwordResetEmailTemplate } = await import("./email-templates");
    const html = passwordResetEmailTemplate(userName, resetLink);
    return sendMail(
      userEmail,
      EMAIL_CONFIG.TEMPLATES.PASSWORD_RESET.subject,
      html
    );
  }

  static async sendSecurityAlertEmail(
    userEmail: string,
    userName: string,
    alertType: string,
    details: string,
    actionRequired: boolean = false
  ) {
    const { securityAlertEmailTemplate } = await import("./email-templates");
    const html = securityAlertEmailTemplate(
      userName,
      alertType,
      details,
      actionRequired
    );
    return sendMail(
      userEmail,
      EMAIL_CONFIG.TEMPLATES.SECURITY_ALERT.subject,
      html
    );
  }

  static async sendLoginAlertEmail(
    userEmail: string,
    userName: string,
    loginTime: string,
    location: string,
    device: string
  ) {
    const { loginAlertEmailTemplate } = await import("./email-templates");
    const html = loginAlertEmailTemplate(userName, loginTime, location, device);
    return sendMail(
      userEmail,
      EMAIL_CONFIG.TEMPLATES.LOGIN_ALERT.subject,
      html
    );
  }
}

// Legacy functions are now in email-templates.ts for backward compatibility
