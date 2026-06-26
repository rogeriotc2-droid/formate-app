import { Router, type Request } from "express";
import { db, usersTable, passwordResetTokensTable } from "@workspace/db";
import { eq, and, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import {
  hashPassword,
  verifyPassword,
  generateResetToken,
  hashResetToken,
  MAX_PASSWORD_LEN,
} from "../lib/auth";
import { sendEmail } from "../lib/email";
import { ADMIN_EMAILS, hasLegacyRtcData, recoverLegacyRtcData } from "./admin";

const router = Router();

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(MAX_PASSWORD_LEN);

const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().max(120).optional(),
});

const signinSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(MAX_PASSWORD_LEN),
});

const forgotSchema = z.object({
  email: emailSchema,
  // Allowlisted app base so the reset link returns to the right frontend
  // without ever trusting an attacker-supplied URL.
  appPath: z.enum(["", "/us"]).default(""),
});

const resetSchema = z.object({
  token: z.string().min(1).max(512),
  password: passwordSchema,
});

const RESET_TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

type PublicUser = { id: string; email: string; name: string | null };

function publicUser(u: { id: string; email: string; name: string | null }): PublicUser {
  return { id: u.id, email: u.email, name: u.name };
}

// Regenerate the session on login to defeat session fixation, then persist.
function startSession(req: Request, userId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = userId;
      req.session.save((err2) => (err2 ? reject(err2) : resolve()));
    });
  });
}

function appOrigin(req: Request): string {
  const domains = process.env.REPLIT_DOMAINS;
  if (domains) return `https://${domains.split(",")[0].trim()}`;
  const host = req.headers.host ?? "localhost";
  const proto = (req.headers["x-forwarded-proto"] as string | undefined) ?? req.protocol;
  return `${proto}://${host}`;
}

router.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
  }
  const { email, password, name } = parsed.data;

  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(usersTable)
    .values({ email, passwordHash, name: name ?? null })
    .returning();

  try {
    await startSession(req, user.id);
  } catch (err) {
    req.log.error({ err }, "Failed to start session after signup");
    return res.status(500).json({ error: "Could not start session" });
  }
  return res.status(201).json({ user: publicUser(user) });
});

router.post("/signin", async (req, res) => {
  const parsed = signinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  // Always run a comparison to keep timing roughly uniform whether or not the
  // account exists (avoids user-enumeration via response time).
  const ok = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, "$2b$12$" + "x".repeat(53));

  if (!user || !ok) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  try {
    await startSession(req, user.id);
  } catch (err) {
    req.log.error({ err }, "Failed to start session after signin");
    return res.status(500).json({ error: "Could not start session" });
  }
  return res.json({ user: publicUser(user) });
});

router.post("/signout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      req.log.error({ err }, "Failed to destroy session");
      return res.status(500).json({ error: "Could not sign out" });
    }
    res.clearCookie("formate.sid", { path: "/" });
    return res.json({ ok: true });
  });
});

router.get("/me", async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    // Session references a deleted user — clear it.
    req.session.destroy(() => {});
    return res.status(401).json({ error: "Unauthorized" });
  }

  // One-time legacy data recovery: if the founder/admin logs in and orphaned
  // RTC records still exist, re-link them to this account. Idempotent and
  // strictly scoped (exact admin email + fixed legacy ids), so it's a no-op
  // for everyone else and after the first successful recovery.
  if (ADMIN_EMAILS.has(user.email.toLowerCase())) {
    try {
      if (await hasLegacyRtcData()) {
        const recovered = await recoverLegacyRtcData(user.id);
        req.log.info({ recovered, adminEmail: user.email }, "Legacy RTC data auto-recovered on /me");
      }
    } catch (err) {
      // Never let recovery break the auth check.
      req.log.error({ err }, "Auto-recovery on /me failed");
    }
  }

  return res.json({ user: publicUser(user) });
});

router.post("/forgot", async (req, res) => {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
  }
  const { email, appPath } = parsed.data;

  const origin = appOrigin(req);

  // Do the lookup + token issuance + email send asynchronously and WITHOUT
  // awaiting, so the response time is identical whether or not the account
  // exists. Combined with the always-200 body, this prevents both content- and
  // timing-based account enumeration.
  void (async () => {
    try {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));
      if (!user) return;

      const { token, tokenHash } = generateResetToken();
      await db.insert(passwordResetTokensTable).values({
        tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      });

      const link = `${origin}${appPath}/reset-password?token=${token}`;
      await sendEmail({
        to: email,
        subject: "Reset your Formate password",
        html: `
<p>Hi${user.name ? " " + user.name.replace(/[<>&]/g, "") : ""},</p>
<p>We received a request to reset your Formate password. Click the link below to choose a new one. This link expires in 1 hour.</p>
<p><a href="${link}" style="display:inline-block;background:#E87722;color:#fff;font-weight:bold;padding:12px 20px;border-radius:6px;text-decoration:none">Reset my password</a></p>
<p>If you didn't ask for this, you can safely ignore this email — your password won't change.</p>
`.trim(),
      });
    } catch (err) {
      req.log.error({ err }, "Failed to send password reset email");
    }
  })();

  // Always respond 200 so callers can't enumerate which emails are registered.
  return res.json({ ok: true });
});

router.post("/reset", async (req, res) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
  }
  const { token, password } = parsed.data;
  const tokenHash = hashResetToken(token);

  const [row] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.tokenHash, tokenHash),
        isNull(passwordResetTokensTable.usedAt),
        gt(passwordResetTokensTable.expiresAt, new Date()),
      ),
    );

  if (!row) {
    return res.status(400).json({ error: "This reset link is invalid or has expired" });
  }

  const passwordHash = await hashPassword(password);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, row.userId));
  await db
    .update(passwordResetTokensTable)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokensTable.tokenHash, tokenHash));

  return res.json({ ok: true });
});

const profileSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

router.patch("/profile", async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
  const [updated] = await db
    .update(usersTable)
    .set({ name: parsed.data.name })
    .where(eq(usersTable.id, userId))
    .returning();
  if (!updated) return res.status(404).json({ error: "User not found" });
  return res.json({ user: publicUser(updated) });
});

export default router;
