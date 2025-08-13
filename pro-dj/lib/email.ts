//import { Resend } from "resend";
import nodemailer from "nodemailer";

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

async function getTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });
  }
  // Ethereal in dev: creates a throwaway account for testing
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
      console.log("Ethereal account created:", testAcc.user, testAcc.pass);
      resolve(tr);
    });
  }
  return transporterPromise;
}


export async function sendMail(to: string, subject: string, html: string) {
  if (!to) return { ok: false, skipped: true };
  const transporter = await getTransporter();
  if (!transporter) return { ok: false, skipped: true };

  const info = await transporter.sendMail({
    from: "Jideogun93@gmail.com>",
    to,
    subject,
    html,
  });
  const preview = nodemailer.getTestMessageUrl?.(info);
  if (preview) console.log("[mail] Preview:", preview);
  return { ok: true, previewUrl: preview };
}

export function acceptEmailHtml(opts: {
    name?: string | null;
    eventType: string;
    eventDateISO: string; // yyyy-mm-dd
    payLink: string;
  }) {
    const { name, eventType, eventDateISO, payLink } = opts;
    return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial">
      <h2>Booking Accepted</h2>
      <p>Hey ${name ?? "there"},</p>
      <p>Your <b>${eventType}</b> request for <b>${eventDateISO}</b> was accepted.</p>
      <p>Please complete payment to confirm your booking:</p>
      <p><a href="${payLink}">Pay now</a></p>
      <p>— Jay Baba</p>
    </div>`;
  }
  
  export function clientConfirmedHtml(opts: {
    eventType: string;
    eventDateISO: string;
  }) {
    const { eventType, eventDateISO } = opts;
    return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial">
      <h2>Payment Received — You’re Booked!</h2>
      <p>Your <b>${eventType}</b> on <b>${eventDateISO}</b> is confirmed.</p>
      <p>Thanks! See you there.</p>
      <p>— Jay Baba</p>
    </div>`;
  }
  
  export function djConfirmedHtml(opts: {
    eventType: string;
    eventDateISO: string;
    clientEmail?: string | null;
  }) {
    const { eventType, eventDateISO, clientEmail } = opts;
    return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial">
      <h2>New Confirmed Booking</h2>
      <p>${eventType} on <b>${eventDateISO}</b> is paid and confirmed.</p>
      ${clientEmail ? `<p>Client: ${clientEmail}</p>` : ""}
    </div>`;
  }
  

// const resendKey = process.env.RESEND_API_KEY;
// export const resend = resendKey ? new Resend(resendKey) : null;

// export async function sendMail(to: string, subject: string, html: string) {
//   if (!resend || !to) return { ok: false, skipped: true };
//   const res = await resend.emails.send({
//     from: "Jideogun93@gmail.com", // set this to a verified sender/domain
//     to,
//     subject,
//     html,
//   });
//   return { ok: !res.error, id: res.data?.id, error: res.error };
// }
