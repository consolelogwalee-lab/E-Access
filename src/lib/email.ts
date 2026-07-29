/**
 * Email via Resend (https://resend.com), server-side only.
 * Uses RESEND_API_KEY + EMAIL_FROM from the environment.
 * When not configured, sendEmail returns false and callers fall back to
 * the on-screen behaviour (showing codes/links in the UI).
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "E-Access <onboarding@resend.dev>";

export function emailEnabled(): boolean {
  return Boolean(RESEND_API_KEY);
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!emailEnabled()) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const shell = (title: string, body: string) => `
<div style="font-family:Arial,Helvetica,sans-serif;background:#f5f5f5;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
    <div style="background:#04040a;padding:20px 28px">
      <span style="display:inline-block;width:34px;height:34px;border-radius:50%;background:#1B1F4E;color:#E2A600;text-align:center;line-height:34px;font-weight:bold;font-size:17px;vertical-align:middle">E</span>
      <span style="color:#ffffff;font-weight:bold;letter-spacing:3px;margin-left:10px;vertical-align:middle">E-ACCESS</span>
    </div>
    <div style="padding:28px">
      <h1 style="margin:0 0 12px;font-size:20px;color:#171717">${title}</h1>
      ${body}
      <p style="margin:24px 0 0;font-size:12px;color:#9ca3af">
        E-Access, by T-Prime Development, Port Harcourt. Land. Property. Possibilities.
      </p>
    </div>
  </div>
</div>`;

export async function sendVerificationCode(to: string, name: string, code: string): Promise<boolean> {
  return sendEmail(to, `${code} is your E-Access verification code`, shell(
    "Confirm your email",
    `<p style="color:#525252;font-size:14px;line-height:22px">Hi ${name.split(" ")[0]}, welcome to E-Access. Enter this code to verify your email address:</p>
     <div style="margin:20px 0;text-align:center">
       <span style="display:inline-block;background:#f5f5f5;border-radius:12px;padding:14px 28px;font-size:28px;font-weight:bold;letter-spacing:8px;color:#171717">${code}</span>
     </div>
     <p style="color:#9ca3af;font-size:12px">If you did not create an account, you can ignore this email.</p>`
  ));
}

export async function sendResetLink(to: string, link: string): Promise<boolean> {
  return sendEmail(to, "Reset your E-Access password", shell(
    "Reset your password",
    `<p style="color:#525252;font-size:14px;line-height:22px">Someone requested a password reset for this account. If it was you, click below. The link works once.</p>
     <div style="margin:20px 0;text-align:center">
       <a href="${link}" style="display:inline-block;background:#E2A600;color:#1c1503;font-weight:bold;text-decoration:none;border-radius:10px;padding:13px 28px;font-size:14px">Choose a new password</a>
     </div>
     <p style="color:#9ca3af;font-size:12px">If you did not request this, ignore this email and your password stays the same.</p>`
  ));
}

export async function sendNotice(to: string, title: string, message: string, ctaLabel?: string, ctaUrl?: string): Promise<boolean> {
  return sendEmail(to, title, shell(
    title,
    `<p style="color:#525252;font-size:14px;line-height:22px">${message}</p>
     ${ctaLabel && ctaUrl ? `<div style="margin:20px 0;text-align:center"><a href="${ctaUrl}" style="display:inline-block;background:#1B1F4E;color:#ffffff;font-weight:bold;text-decoration:none;border-radius:10px;padding:13px 28px;font-size:14px">${ctaLabel}</a></div>` : ""}`
  ));
}
