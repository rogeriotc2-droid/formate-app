import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "node:crypto";
import { db, xeroConnectionsTable, xeroContactsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

const XERO_AUTHORIZE_URL = "https://login.xero.com/identity/connect/authorize";
const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
const XERO_CONNECTIONS_URL = "https://api.xero.com/connections";
const XERO_CONTACTS_URL = "https://api.xero.com/api.xro/2.0/Contacts";
const XERO_REVOKE_URL = "https://identity.xero.com/connect/revocation";

const SCOPES = ["offline_access", "openid", "profile", "email", "accounting.contacts.read"].join(" ");

function getBaseUrl(req: Request): string {
  // Prefer the host the user actually browsed to (works for custom domains).
  const forwardedHost = (req.headers["x-forwarded-host"] as string | undefined)?.split(",")[0]?.trim();
  const host = forwardedHost || req.headers.host;
  if (host) {
    const proto = ((req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim()) || (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  const envDomain = process.env["REPLIT_DOMAINS"]?.split(",")[0];
  if (envDomain) return `https://${envDomain}`;
  return `https://${req.headers.host}`;
}

function getRedirectUri(req: Request): string {
  return `${getBaseUrl(req)}/api/xero/callback`;
}

function getClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env["XERO_CLIENT_ID"];
  const clientSecret = process.env["XERO_CLIENT_SECRET"];
  if (!clientId || !clientSecret) {
    throw new Error("Xero credentials not configured");
  }
  return { clientId, clientSecret };
}

function signState(payload: string): string {
  const secret = process.env["SESSION_SECRET"];
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set (>=16 chars) to sign OAuth state");
  }
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function buildState(userId: string): string {
  const nonce = crypto.randomBytes(8).toString("hex");
  const ts = Date.now().toString();
  const payload = `${userId}:${nonce}:${ts}`;
  const sig = signState(payload);
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

function verifyState(state: string): string | null {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 4) return null;
    const [userId, nonce, ts, sig] = parts;
    const expected = signState(`${userId}:${nonce}:${ts}`);
    if (sig !== expected) return null;
    const age = Date.now() - Number(ts);
    if (age > 10 * 60 * 1000) return null;
    return userId as string;
  } catch {
    return null;
  }
}

async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const { clientId, clientSecret } = getClientCredentials();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken });
  const res = await fetch(XERO_TOKEN_URL, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Xero refresh failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number }>;
}

async function getValidAccessToken(userId: string): Promise<{ accessToken: string; tenantId: string } | null> {
  const rows = await db.select().from(xeroConnectionsTable).where(eq(xeroConnectionsTable.userId, userId)).limit(1);
  const conn = rows[0];
  if (!conn) return null;
  const buffer = 60 * 1000;
  if (conn.expiresAt.getTime() - buffer > Date.now()) {
    return { accessToken: conn.accessToken, tenantId: conn.tenantId };
  }
  const refreshed = await refreshAccessToken(conn.refreshToken);
  const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
  await db
    .update(xeroConnectionsTable)
    .set({ accessToken: refreshed.access_token, refreshToken: refreshed.refresh_token, expiresAt })
    .where(eq(xeroConnectionsTable.userId, userId));
  return { accessToken: refreshed.access_token, tenantId: conn.tenantId };
}

router.get("/connect", requireAuth, (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { userId: string }).userId;
    const { clientId } = getClientCredentials();
    const state = buildState(userId);
    const url = new URL(XERO_AUTHORIZE_URL);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", clientId);
    const redirectUri = getRedirectUri(req);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", SCOPES);
    url.searchParams.set("state", state);
    req.log.info({ redirectUri, host: req.headers.host, forwardedHost: req.headers["x-forwarded-host"] }, "xero connect: redirect_uri sent");
    return res.json({ url: url.toString() });
  } catch (err) {
    req.log.error({ err }, "xero connect failed");
    return res.status(500).json({ error: "Failed to start Xero connection" });
  }
});

router.get("/callback", async (req: Request, res: Response) => {
  const code = req.query["code"] as string | undefined;
  const state = req.query["state"] as string | undefined;
  const error = req.query["error"] as string | undefined;
  const baseUrl = getBaseUrl(req);
  const redirectBack = (status: "success" | "error", reason?: string) => {
    const target = new URL("/integrations", baseUrl);
    target.searchParams.set("xero", status);
    if (reason) target.searchParams.set("reason", reason);
    res.redirect(target.toString());
  };

  if (error) {
    req.log.warn({ error }, "xero callback returned error");
    return redirectBack("error", error);
  }
  if (!code || !state) {
    return redirectBack("error", "missing_params");
  }
  const userId = verifyState(state);
  if (!userId) {
    return redirectBack("error", "invalid_state");
  }

  try {
    const { clientId, clientSecret } = getClientCredentials();
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch(XERO_TOKEN_URL, {
      method: "POST",
      headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: getRedirectUri(req),
      }),
    });
    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      req.log.error({ status: tokenRes.status, text }, "xero token exchange failed");
      return redirectBack("error", "token_exchange_failed");
    }
    const tokens = (await tokenRes.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      scope: string;
    };

    const connRes = await fetch(XERO_CONNECTIONS_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!connRes.ok) {
      const text = await connRes.text();
      req.log.error({ status: connRes.status, text }, "xero connections fetch failed");
      return redirectBack("error", "no_tenants");
    }
    const tenants = (await connRes.json()) as Array<{ tenantId: string; tenantName: string; tenantType: string }>;
    const tenant = tenants.find((t) => t.tenantType === "ORGANISATION") ?? tenants[0];
    if (!tenant) {
      return redirectBack("error", "no_tenants");
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    await db
      .insert(xeroConnectionsTable)
      .values({
        userId: userId,
        tenantId: tenant.tenantId,
        tenantName: tenant.tenantName,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scopes: tokens.scope,
      })
      .onConflictDoUpdate({
        target: xeroConnectionsTable.userId,
        set: {
          tenantId: tenant.tenantId,
          tenantName: tenant.tenantName,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
          scopes: tokens.scope,
        },
      });

    return redirectBack("success");
  } catch (err) {
    req.log.error({ err }, "xero callback exception");
    return redirectBack("error", "unexpected");
  }
});

router.get("/status", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: string }).userId;
  const rows = await db
    .select({
      tenantName: xeroConnectionsTable.tenantName,
      lastSyncedAt: xeroConnectionsTable.lastSyncedAt,
      connectedAt: xeroConnectionsTable.createdAt,
    })
    .from(xeroConnectionsTable)
    .where(eq(xeroConnectionsTable.userId, userId))
    .limit(1);

  const conn = rows[0];
  if (!conn) {
    return res.json({ connected: false });
  }
  const countRows = await db
    .select({ id: xeroContactsTable.id })
    .from(xeroContactsTable)
    .where(eq(xeroContactsTable.userId, userId));
  return res.json({
    connected: true,
    tenantName: conn.tenantName,
    lastSyncedAt: conn.lastSyncedAt,
    connectedAt: conn.connectedAt,
    contactCount: countRows.length,
  });
});

router.post("/sync", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: string }).userId;
  try {
    const token = await getValidAccessToken(userId);
    if (!token) {
      return res.status(400).json({ error: "Not connected to Xero" });
    }

    const contacts: Array<Record<string, unknown>> = [];
    let page = 1;
    const pageSize = 100;
    while (page < 50) {
      const url = `${XERO_CONTACTS_URL}?page=${page}&pageSize=${pageSize}&includeArchived=false`;
      const r = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          "Xero-tenant-id": token.tenantId,
          Accept: "application/json",
        },
      });
      if (!r.ok) {
        const text = await r.text();
        req.log.error({ status: r.status, text }, "xero contacts fetch failed");
        return res.status(502).json({ error: "Failed to fetch contacts from Xero" });
      }
      const data = (await r.json()) as { Contacts?: Array<Record<string, unknown>> };
      const batch = data.Contacts ?? [];
      contacts.push(...batch);
      if (batch.length < pageSize) break;
      page += 1;
    }

    const rows = contacts.map((c) => {
      const addresses = (c["Addresses"] as Array<Record<string, unknown>> | undefined) ?? [];
      const addr = addresses.find((a) => a["AddressType"] === "STREET") ?? addresses[0] ?? {};
      const phones = (c["Phones"] as Array<Record<string, unknown>> | undefined) ?? [];
      const phone = phones.find((p) => p["PhoneNumber"]) as Record<string, unknown> | undefined;
      const phoneStr = phone ? `${phone["PhoneCountryCode"] ?? ""}${phone["PhoneAreaCode"] ?? ""}${phone["PhoneNumber"] ?? ""}`.trim() : null;
      return {
        userId: userId,
        xeroContactId: String(c["ContactID"]),
        name: String(c["Name"] ?? "Unnamed"),
        firstName: (c["FirstName"] as string) ?? null,
        lastName: (c["LastName"] as string) ?? null,
        emailAddress: (c["EmailAddress"] as string) ?? null,
        phone: phoneStr || null,
        addressLine: ((addr["AddressLine1"] as string) ?? null),
        city: ((addr["City"] as string) ?? null),
        postalCode: ((addr["PostalCode"] as string) ?? null),
        country: ((addr["Country"] as string) ?? null),
        isCustomer: c["IsCustomer"] ? 1 : 0,
        isSupplier: c["IsSupplier"] ? 1 : 0,
        raw: c,
      };
    });

    await db.transaction(async (tx) => {
      await tx.delete(xeroContactsTable).where(eq(xeroContactsTable.userId, userId));
      const chunkSize = 200;
      for (let i = 0; i < rows.length; i += chunkSize) {
        await tx.insert(xeroContactsTable).values(rows.slice(i, i + chunkSize));
      }
      await tx
        .update(xeroConnectionsTable)
        .set({ lastSyncedAt: new Date() })
        .where(eq(xeroConnectionsTable.userId, userId));
    });

    return res.json({ synced: contacts.length });
  } catch (err) {
    req.log.error({ err }, "xero sync failed");
    return res.status(500).json({ error: "Sync failed" });
  }
});

router.get("/contacts", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: string }).userId;
  const rows = await db
    .select({
      id: xeroContactsTable.xeroContactId,
      name: xeroContactsTable.name,
      firstName: xeroContactsTable.firstName,
      lastName: xeroContactsTable.lastName,
      emailAddress: xeroContactsTable.emailAddress,
      phone: xeroContactsTable.phone,
      addressLine: xeroContactsTable.addressLine,
      city: xeroContactsTable.city,
      postalCode: xeroContactsTable.postalCode,
      country: xeroContactsTable.country,
    })
    .from(xeroContactsTable)
    .where(eq(xeroContactsTable.userId, userId));
  return res.json(rows);
});

router.post("/disconnect", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: string }).userId;
  try {
    const rows = await db.select().from(xeroConnectionsTable).where(eq(xeroConnectionsTable.userId, userId)).limit(1);
    const conn = rows[0];
    if (conn) {
      try {
        const { clientId, clientSecret } = getClientCredentials();
        const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
        await fetch(XERO_REVOKE_URL, {
          method: "POST",
          headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ token: conn.refreshToken }),
        });
      } catch (err) {
        req.log.warn({ err }, "xero revoke failed (continuing)");
      }
    }
    await db.delete(xeroContactsTable).where(eq(xeroContactsTable.userId, userId));
    await db.delete(xeroConnectionsTable).where(eq(xeroConnectionsTable.userId, userId));
    return res.json({ disconnected: true });
  } catch (err) {
    req.log.error({ err }, "xero disconnect failed");
    return res.status(500).json({ error: "Disconnect failed" });
  }
});

export default router;
