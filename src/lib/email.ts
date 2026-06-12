/**
 * Send an email via Resend (https://resend.com). Falls back to logging the
 * message on the server when RESEND_API_KEY isn't configured, so the password
 * flow remains testable in development.
 */
export async function sendEmail(opts: { to: string; subject: string; text: string }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Wildtouch JMS <onboarding@resend.dev>";

  if (!key) {
    console.log(`[email fallback] To: ${opts.to} | ${opts.subject}\n${opts.text}`);
    return { delivered: false, fallback: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, text: opts.text }),
  });

  if (!res.ok) {
    let msg = `email send failed (${res.status})`;
    try {
      const e = await res.json();
      msg = e?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return { delivered: true, fallback: false };
}
