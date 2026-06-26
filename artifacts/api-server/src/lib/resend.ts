import { Resend } from "resend";

let connectionSettings: Record<string, { settings: { api_key: string; from_email: string } }> | null = null;

async function getCredentials(): Promise<{ apiKey: string; fromEmail: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) throw new Error("X-Replit-Token not found");

  const data = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=resend`,
    { headers: { Accept: "application/json", "X-Replit-Token": xReplitToken } }
  ).then(r => r.json()) as { items?: Array<{ settings: { api_key: string; from_email: string } }> };

  const settings = data?.items?.[0]?.settings;
  if (!settings?.api_key) throw new Error("Resend not connected");
  return { apiKey: settings.api_key, fromEmail: settings.from_email ?? "noreply@safeiq.app" };
}

export async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return { client: new Resend(apiKey), fromEmail };
}
