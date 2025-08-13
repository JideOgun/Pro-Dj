import { Resend } from "resend";

const resendKey = process.env.RESEND_API_KEY;
export const resend = resendKey ? new Resend(resendKey) : null;

export async function sendMail(to: string, subject: string, html: string) {
  if (!resend || !to) return { ok: false, skipped: true };
  const res = await resend.emails.send({
    from: "Jideogun93@gmail.com", // set this to a verified sender/domain
    to,
    subject,
    html,
  });
  return { ok: !res.error, id: res.data?.id, error: res.error };
}
