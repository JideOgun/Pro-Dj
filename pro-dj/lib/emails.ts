// lib/emails.ts
const wrap = (body: string) => `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;line-height:1.6;color:#111">
    ${body}
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
    <div style="font-size:12px;color:#666">Pro-DJ • This is a test environment email</div>
  </div>
`;

export function acceptEmailHtml(opts: {
  name?: string | null;
  eventType: string;
  eventDateISO: string; // yyyy-mm-dd
  payLink: string;
}) {
  const { name, eventType, eventDateISO, payLink } = opts;
  return wrap(`
    <h2>Booking Accepted</h2>
    <p>Hey ${name ?? "there"},</p>
    <p>Your <b>${eventType}</b> request for <b>${eventDateISO}</b> was accepted.</p>
    <p>Please complete payment to confirm your booking:</p>
    <p><a href="${payLink}">Pay now</a></p>
    <p>— Jay Baba</p>
  `);
}

export function clientConfirmedHtml(opts: {
  eventType: string;
  eventDateISO: string;
}) {
  const { eventType, eventDateISO } = opts;
  return wrap(`
    <h2>Payment Received — You’re Booked!</h2>
    <p>Your <b>${eventType}</b> on <b>${eventDateISO}</b> is confirmed.</p>
    <p>Thanks! See you there.</p>
    <p>— Jay Baba</p>
  `);
}

export function djConfirmedHtml(opts: {
  eventType: string;
  eventDateISO: string;
  clientEmail?: string | null;
}) {
  const { eventType, eventDateISO, clientEmail } = opts;
  return wrap(`
    <h2>New Confirmed Booking</h2>
    <p>${eventType} on <b>${eventDateISO}</b> is paid and confirmed.</p>
    ${clientEmail ? `<p>Client: ${clientEmail}</p>` : ""}
  `);
}
