import { EMAIL_CONFIG } from "./email-config";

// Base email template wrapper
function baseEmailTemplate(content: string, title?: string) {
  // Use a styled text logo instead of image for better email compatibility
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title || EMAIL_CONFIG.APP.NAME}</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .logo {
          font-size: 36px;
          font-weight: 900;
          margin-bottom: 10px;
          letter-spacing: 3px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .logo-pro {
          color: #ffffff;
        }
        .logo-dj {
          color: #ffd700;
        }
        .logo-divider {
          color: #ffffff;
          margin: 0 5px;
        }
        .tagline {
          margin: 0;
          opacity: 0.9;
          font-size: 14px;
          font-weight: 300;
          letter-spacing: 1px;
        }
        .content {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 500;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #666;
          font-size: 14px;
        }
        .highlight {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">
          <span class="logo-pro">PRO</span><span class="logo-divider">-</span><span class="logo-dj">DJ</span>
        </div>
        <p class="tagline">Professional DJ Booking Platform</p>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>© 2024 ${EMAIL_CONFIG.APP.NAME}. All rights reserved.</p>
        <p>Need help? Contact us at <a href="mailto:${
          EMAIL_CONFIG.APP.SUPPORT_EMAIL
        }">${EMAIL_CONFIG.APP.SUPPORT_EMAIL}</a></p>

      </div>
    </body>
    </html>
  `;
}

// User Registration Templates
export function welcomeEmailTemplate(userName: string) {
  const content = `
    <h2>Welcome to ${EMAIL_CONFIG.APP.NAME}! 🎉</h2>
    <p>Hi ${userName},</p>
    <p>Welcome to ${EMAIL_CONFIG.APP.NAME}! We're excited to have you join our community of music lovers and DJs.</p>
    <p>Here's what you can do now:</p>
    <ul>
      <li>Browse and discover amazing DJs</li>
      <li>Book your next event</li>
      <li>Explore mixes and music</li>
      <li>Connect with the community</li>
    </ul>
    <a href="${EMAIL_CONFIG.APP.URL}/mixes" class="button">Start Exploring</a>
    <p>If you have any questions, feel free to reach out to our support team.</p>
    <p>Best regards,<br>The ${EMAIL_CONFIG.APP.NAME} Team</p>
  `;

  return baseEmailTemplate(content, "Welcome to Pro-DJ!");
}

export function djWelcomeEmailTemplate(stageName: string) {
  const content = `
    <h2>Welcome to ${EMAIL_CONFIG.APP.NAME}, ${stageName}! 🎧</h2>
    <p>Congratulations! Your DJ profile has been created successfully.</p>
    <p>Here's what you can do now:</p>
    <ul>
      <li>Complete your profile with photos and details</li>
      <li>Upload your mixes and showcase your talent</li>
      <li>Set your pricing and availability</li>
      <li>Start receiving booking requests</li>
    </ul>
    <a href="${EMAIL_CONFIG.APP.URL}/dashboard/dj" class="button">Complete Your Profile</a>
    <div class="highlight">
      <strong>Next Steps:</strong> Your profile is currently pending admin approval. 
      You'll receive an email once it's approved and you can start accepting bookings.
    </div>
    <p>Best regards,<br>The ${EMAIL_CONFIG.APP.NAME} Team</p>
  `;

  return baseEmailTemplate(content, "DJ Registration Complete");
}

// Booking Templates
export function bookingRequestEmailTemplate(
  djName: string,
  clientName: string,
  eventType: string,
  eventDate: string,
  eventTime: string,
  venue: string,
  guestCount: number
) {
  const content = `
    <h2>New Booking Request 📅</h2>
    <p>Hi ${djName},</p>
    <p>You have a new booking request from ${clientName}!</p>
    <div class="highlight">
      <strong>Event Details:</strong><br>
      Type: ${eventType}<br>
      Date: ${eventDate}<br>
      Time: ${eventTime}<br>
      Venue: ${venue}<br>
      Guest Count: ${guestCount}
    </div>
    <a href="${EMAIL_CONFIG.APP.URL}/dashboard/dj" class="button">Review Request</a>
    <p>Please review and respond to this request within 24 hours.</p>
    <p>Best regards,<br>The ${EMAIL_CONFIG.APP.NAME} Team</p>
  `;

  return baseEmailTemplate(content, "New Booking Request");
}

export function bookingAcceptedEmailTemplate(
  clientName: string,
  djName: string,
  eventType: string,
  eventDate: string,
  payLink: string
) {
  const content = `
    <h2>Booking Accepted! ✅</h2>
    <p>Hi ${clientName},</p>
    <p>Great news! ${djName} has accepted your booking request.</p>
    <div class="highlight">
      <strong>Event Details:</strong><br>
      DJ: ${djName}<br>
      Type: ${eventType}<br>
      Date: ${eventDate}
    </div>
    <p>To confirm your booking, please complete payment:</p>
    <a href="${payLink}" class="button">Complete Payment</a>
    <p>Your booking will be confirmed once payment is received.</p>
    <p>Best regards,<br>The ${EMAIL_CONFIG.APP.NAME} Team</p>
  `;

  return baseEmailTemplate(content, "Booking Accepted");
}

// Legacy booking templates (for backward compatibility)
export function acceptEmailHtml(opts: {
  name?: string | null;
  eventType: string;
  eventDateISO: string; // yyyy-mm-dd
  payLink: string;
}) {
  const { name, eventType, eventDateISO, payLink } = opts;
  return baseEmailTemplate(
    `
    <h2>Booking Accepted</h2>
    <p>Hey ${name ?? "there"},</p>
    <p>Your <b>${eventType}</b> request for <b>${eventDateISO}</b> was accepted.</p>
    <p>Please complete payment to confirm your booking:</p>
    <p><a href="${payLink}" class="button">Pay now</a></p>
    <p>— Jay Baba</p>
  `,
    "Booking Accepted"
  );
}

export function clientConfirmedHtml(opts: {
  eventType: string;
  eventDateISO: string;
}) {
  const { eventType, eventDateISO } = opts;
  return baseEmailTemplate(
    `
    <h2>Payment Received — You're Booked!</h2>
    <p>Your <b>${eventType}</b> on <b>${eventDateISO}</b> is confirmed.</p>
    <p>Thanks! See you there.</p>
    <p>— Jay Baba</p>
  `,
    "Payment Received"
  );
}

export function djConfirmedHtml(opts: {
  eventType: string;
  eventDateISO: string;
  clientEmail?: string | null;
}) {
  const { eventType, eventDateISO, clientEmail } = opts;
  return baseEmailTemplate(
    `
    <h2>New Confirmed Booking</h2>
    <p>${eventType} on <b>${eventDateISO}</b> is paid and confirmed.</p>
    ${clientEmail ? `<p>Client: ${clientEmail}</p>` : ""}
  `,
    "New Confirmed Booking"
  );
}

export function bookingConfirmedEmailTemplate(
  clientName: string,
  djName: string,
  eventType: string,
  eventDate: string,
  eventTime: string,
  venue: string
) {
  const content = `
    <h2>Booking Confirmed! 🎉</h2>
    <p>Hi ${clientName},</p>
    <p>Your booking is confirmed and you're all set!</p>
    <div class="highlight">
      <strong>Event Details:</strong><br>
      DJ: ${djName}<br>
      Type: ${eventType}<br>
      Date: ${eventDate}<br>
      Time: ${eventTime}<br>
      Venue: ${venue}
    </div>
    <p>${djName} will contact you soon to discuss event details and music preferences.</p>
    <a href="${EMAIL_CONFIG.APP.URL}/dashboard/bookings" class="button">View Booking</a>
    <p>Have a great event!</p>
    <p>Best regards,<br>The ${EMAIL_CONFIG.APP.NAME} Team</p>
  `;

  return baseEmailTemplate(content, "Booking Confirmed");
}

export function bookingCancelledEmailTemplate(
  userName: string,
  eventType: string,
  eventDate: string,
  reason?: string
) {
  const content = `
    <h2>Booking Cancelled</h2>
    <p>Hi ${userName},</p>
    <p>Your booking has been cancelled.</p>
    <div class="highlight">
      <strong>Cancelled Event:</strong><br>
      Type: ${eventType}<br>
      Date: ${eventDate}
      ${reason ? `<br>Reason: ${reason}` : ""}
    </div>
    <p>If you have any questions about this cancellation, please contact our support team.</p>
    <a href="${EMAIL_CONFIG.APP.URL}/mixes" class="button">Book Another DJ</a>
    <p>Best regards,<br>The ${EMAIL_CONFIG.APP.NAME} Team</p>
  `;

  return baseEmailTemplate(content, "Booking Cancelled");
}

// Payment Templates
export function paymentReceivedEmailTemplate(
  userName: string,
  amount: string,
  eventType: string,
  eventDate: string
) {
  const content = `
    <h2>Payment Received! 💰</h2>
    <p>Hi ${userName},</p>
    <p>Thank you! We've received your payment of ${amount}.</p>
    <div class="highlight">
      <strong>Payment Details:</strong><br>
      Amount: ${amount}<br>
      Event: ${eventType}<br>
      Date: ${eventDate}
    </div>
    <p>Your booking is now confirmed and your DJ will be in touch soon.</p>
    <a href="${EMAIL_CONFIG.APP.URL}/dashboard/bookings" class="button">View Booking</a>
    <p>Best regards,<br>The ${EMAIL_CONFIG.APP.NAME} Team</p>
  `;

  return baseEmailTemplate(content, "Payment Received");
}

export function paymentFailedEmailTemplate(
  userName: string,
  eventType: string,
  eventDate: string,
  retryLink: string
) {
  const content = `
    <h2>Payment Failed ⚠️</h2>
    <p>Hi ${userName},</p>
    <p>We couldn't process your payment for your ${eventType} booking on ${eventDate}.</p>
    <div class="highlight">
      <strong>What to do:</strong><br>
      • Check your payment method<br>
      • Ensure sufficient funds<br>
      • Try again with a different card if needed
    </div>
    <a href="${retryLink}" class="button">Retry Payment</a>
    <p>If you continue to have issues, please contact our support team.</p>
    <p>Best regards,<br>The ${EMAIL_CONFIG.APP.NAME} Team</p>
  `;

  return baseEmailTemplate(content, "Payment Failed");
}

// Account Templates
export function passwordResetEmailTemplate(
  userName: string,
  resetLink: string
) {
  const content = `
    <h2>Password Reset Request</h2>
    <p>Hi ${userName},</p>
    <p>We received a request to reset your password.</p>
    <p>Click the button below to create a new password:</p>
    <a href="${resetLink}" class="button">Reset Password</a>
    <div class="highlight">
      <strong>Security Note:</strong><br>
      This link will expire in 1 hour. If you didn't request this, please ignore this email.
    </div>
    <p>Best regards,<br>The ${EMAIL_CONFIG.APP.NAME} Team</p>
  `;

  return baseEmailTemplate(content, "Password Reset");
}

export function accountActivatedEmailTemplate(userName: string) {
  const content = `
    <h2>Account Activated! ✅</h2>
    <p>Hi ${userName},</p>
    <p>Your account has been activated successfully.</p>
    <p>You can now access all features of ${EMAIL_CONFIG.APP.NAME}.</p>
    <a href="${EMAIL_CONFIG.APP.URL}/dashboard" class="button">Go to Dashboard</a>
    <p>Best regards,<br>The ${EMAIL_CONFIG.APP.NAME} Team</p>
  `;

  return baseEmailTemplate(content, "Account Activated");
}

export function accountSuspendedEmailTemplate(
  userName: string,
  reason: string,
  duration?: string
) {
  const content = `
    <h2>Account Suspended ⚠️</h2>
    <p>Hi ${userName},</p>
    <p>Your account has been suspended.</p>
    <div class="highlight">
      <strong>Reason:</strong> ${reason}
      ${duration ? `<br><strong>Duration:</strong> ${duration}` : ""}
    </div>
    <p>If you believe this is an error or have questions, please contact our support team.</p>
    <p>Best regards,<br>The ${EMAIL_CONFIG.APP.NAME} Team</p>
  `;

  return baseEmailTemplate(content, "Account Suspended");
}

// DJ Specific Templates
export function djApprovedEmailTemplate(stageName: string) {
  const content = `
    <h2>DJ Profile Approved! 🎉</h2>
    <p>Hi ${stageName},</p>
    <p>Congratulations! Your DJ profile has been approved.</p>
    <p>You can now:</p>
    <ul>
      <li>Receive booking requests</li>
      <li>Set your availability</li>
      <li>Upload mixes and showcase your work</li>
      <li>Connect with clients</li>
    </ul>
    <a href="${EMAIL_CONFIG.APP.URL}/dashboard/dj" class="button">Go to Dashboard</a>
    <p>Best regards,<br>The ${EMAIL_CONFIG.APP.NAME} Team</p>
  `;

  return baseEmailTemplate(content, "DJ Profile Approved");
}

export function djRejectedEmailTemplate(
  stageName: string,
  reason: string,
  nextSteps: string
) {
  const content = `
    <h2>DJ Profile Review</h2>
    <p>Hi ${stageName},</p>
    <p>We've reviewed your DJ profile and need some adjustments before approval.</p>
    <div class="highlight">
      <strong>Reason:</strong> ${reason}
    </div>
    <p><strong>Next Steps:</strong> ${nextSteps}</p>
    <a href="${EMAIL_CONFIG.APP.URL}/dashboard/dj/profile" class="button">Update Profile</a>
    <p>If you have questions, please contact our support team.</p>
    <p>Best regards,<br>The ${EMAIL_CONFIG.APP.NAME} Team</p>
  `;

  return baseEmailTemplate(content, "DJ Profile Review");
}

// Notification Templates
export function newFollowerEmailTemplate(
  userName: string,
  followerName: string
) {
  const content = `
    <h2>New Follower! 👥</h2>
    <p>Hi ${userName},</p>
    <p>${followerName} is now following you!</p>
    <p>They'll be notified when you upload new mixes or post updates.</p>
    <a href="${EMAIL_CONFIG.APP.URL}/dashboard" class="button">View Profile</a>
    <p>Best regards,<br>The ${EMAIL_CONFIG.APP.NAME} Team</p>
  `;

  return baseEmailTemplate(content, "New Follower");
}

export function newLikeEmailTemplate(
  userName: string,
  likerName: string,
  mixTitle: string
) {
  const content = `
    <h2>New Like! ❤️</h2>
    <p>Hi ${userName},</p>
    <p>${likerName} liked your mix "${mixTitle}"!</p>
    <a href="${EMAIL_CONFIG.APP.URL}/mixes" class="button">View Mix</a>
    <p>Best regards,<br>The ${EMAIL_CONFIG.APP.NAME} Team</p>
  `;

  return baseEmailTemplate(content, "New Like");
}

export function newRepostEmailTemplate(
  userName: string,
  reposterName: string,
  mixTitle: string
) {
  const content = `
    <h2>Your Mix Was Reposted! 🔄</h2>
    <p>Hi ${userName},</p>
    <p>${reposterName} reposted your mix "${mixTitle}"!</p>
    <p>This helps more people discover your music.</p>
    <a href="${EMAIL_CONFIG.APP.URL}/mixes" class="button">View Mix</a>
    <p>Best regards,<br>The ${EMAIL_CONFIG.APP.NAME} Team</p>
  `;

  return baseEmailTemplate(content, "New Repost");
}

// Security Templates
export function securityAlertEmailTemplate(
  userName: string,
  alertType: string,
  details: string,
  actionRequired: boolean = false
) {
  const content = `
    <h2>Security Alert! 🔒</h2>
    <p>Hi ${userName},</p>
    <p>We detected a security event on your account.</p>
    <div class="highlight">
      <strong>Alert Type:</strong> ${alertType}<br>
      <strong>Details:</strong> ${details}
    </div>
    ${
      actionRequired
        ? `
      <p><strong>Action Required:</strong> Please review your account security settings.</p>
      <a href="${EMAIL_CONFIG.APP.URL}/dashboard/account" class="button">Review Security</a>
    `
        : `
      <p>This is for your information. No action is required.</p>
    `
    }
    <p>If you didn't perform this action, please contact our support team immediately.</p>
    <p>Best regards,<br>The ${EMAIL_CONFIG.APP.NAME} Team</p>
  `;

  return baseEmailTemplate(content, "Security Alert");
}

export function loginAlertEmailTemplate(
  userName: string,
  loginTime: string,
  location: string,
  device: string
) {
  const content = `
    <h2>New Login Detected 🔐</h2>
    <p>Hi ${userName},</p>
    <p>We detected a new login to your account.</p>
    <div class="highlight">
      <strong>Login Details:</strong><br>
      Time: ${loginTime}<br>
      Location: ${location}<br>
      Device: ${device}
    </div>
    <p>If this was you, no action is needed.</p>
    <p>If this wasn't you, please change your password immediately.</p>
    <a href="${EMAIL_CONFIG.APP.URL}/dashboard/account" class="button">Review Account</a>
    <p>Best regards,<br>The ${EMAIL_CONFIG.APP.NAME} Team</p>
  `;

  return baseEmailTemplate(content, "New Login Detected");
}
