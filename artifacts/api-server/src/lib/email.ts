const BREVO_FROM_NAME = "Formate";
const BREVO_FROM_EMAIL = process.env.GMAIL_USER ?? "formate.app@gmail.com";

export function getFromEmail(): string {
  return `${BREVO_FROM_NAME} <${BREVO_FROM_EMAIL}>`;
}

/**
 * Send a transactional email via Brevo.
 * Requires BREVO_API_KEY in environment.
 * From address is GMAIL_USER (formate.app@gmail.com) — must be a verified
 * sender in the Brevo account, or replaced with a verified domain address.
 */
export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  text?: string;
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY env var must be set");

  const toAddresses = Array.isArray(options.to)
    ? options.to.map((email) => ({ email }))
    : [{ email: options.to }];

  const body: Record<string, unknown> = {
    sender: { name: BREVO_FROM_NAME, email: BREVO_FROM_EMAIL },
    to: toAddresses,
    subject: options.subject,
    htmlContent: options.html,
  };
  if (options.text) body.textContent = options.text;
  if (options.replyTo) body.replyTo = { email: options.replyTo };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      `Brevo API error ${res.status}: ${JSON.stringify(errBody)}`,
    );
  }
}
