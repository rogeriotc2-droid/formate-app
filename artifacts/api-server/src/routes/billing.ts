import { Router } from "express";
import { db } from "@workspace/db";
import { companiesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";
import { logger } from "../lib/logger";

const router = Router();

const TRIAL_DAYS = 30;

function trialDaysRemaining(trialStartedAt: Date | null): number | null {
  if (!trialStartedAt) return null;
  const elapsed = Math.floor(
    (Date.now() - trialStartedAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(0, TRIAL_DAYS - elapsed);
}

// Auto-start trial and return trial/subscription status + plans
router.get("/", async (req, res) => {
  const userId = (req as any).userId as string;

  let [company] = await db
    .select()
    .from(companiesTable)
    .where(eq(companiesTable.userId, userId));

  if (!company) {
    return res.status(404).json({ error: "Company not found" });
  }

  // Auto-start trial on first billing page visit
  if (!company.trialStartedAt) {
    [company] = await db
      .update(companiesTable)
      .set({ trialStartedAt: new Date() })
      .where(eq(companiesTable.userId, userId))
      .returning();
  }

  const daysRemaining = trialDaysRemaining(company.trialStartedAt);

  // Get subscription from Stripe sync table if available
  let subscriptionStatus: string | null = null;
  if (company.stripeSubscriptionId) {
    try {
      const result = await db.execute(
        sql`SELECT status FROM stripe.subscriptions WHERE id = ${company.stripeSubscriptionId} LIMIT 1`,
      );
      subscriptionStatus = (result.rows[0] as any)?.status ?? null;
    } catch {
      // stripe schema not ready yet
    }
  }

  const isActive =
    subscriptionStatus === "active" ||
    subscriptionStatus === "trialing" ||
    company.plan === "founding";

  return res.json({
    currentPlan: company.plan,
    trialStartedAt: company.trialStartedAt,
    trialDaysRemaining: daysRemaining,
    trialExpired: daysRemaining !== null && daysRemaining === 0 && !isActive,
    isActive,
    subscriptionStatus,
    foundingPriceNzd: 9,
  });
});

// Create Stripe checkout session for founding member plan
router.post("/checkout", async (req, res) => {
  const userId = (req as any).userId as string;

  const [company] = await db
    .select()
    .from(companiesTable)
    .where(eq(companiesTable.userId, userId));

  if (!company) {
    return res.status(404).json({ error: "Company not found" });
  }

  try {
    const stripe = await getUncachableStripeClient();

    // Find or create the Founding Member product + price
    let priceId: string;

    const products = await stripe.products.search({
      query: "name:'Founding Member' AND active:'true'",
    });

    if (products.data.length > 0) {
      const prices = await stripe.prices.list({
        product: products.data[0].id,
        active: true,
        currency: "nzd",
      });
      if (prices.data.length === 0) {
        return res.status(500).json({ error: "No NZD price found for Founding Member plan" });
      }
      priceId = prices.data[0].id;
    } else {
      // Auto-seed on first checkout
      logger.info("Founding Member product not found — creating now");
      const product = await stripe.products.create({
        name: "Founding Member",
        description: "Locked-in founding member rate — $9 NZD/month forever. Formate safety form management for tradies.",
        metadata: { tier: "founding" },
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: 900,
        currency: "nzd",
        recurring: { interval: "month" },
        metadata: { tier: "founding" },
      });
      priceId = price.id;
      logger.info({ priceId }, "Founding Member product + price created");
    }

    // Get or create Stripe customer
    let customerId = company.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: company.mainContactEmail ?? undefined,
        name: company.businessName,
        metadata: { userId: userId },
      });
      customerId = customer.id;
      await db
        .update(companiesTable)
        .set({ stripeCustomerId: customerId })
        .where(eq(companiesTable.userId, userId));
    }

    // Compute remaining trial days to pass to Stripe (so no double-charging)
    const remaining = trialDaysRemaining(company.trialStartedAt);
    const trialDays = remaining !== null && remaining > 0 ? remaining : undefined;

    const baseUrl =
      process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
        : "https://formate.co.nz";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_collection: "if_required",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: trialDays
        ? { trial_period_days: trialDays }
        : undefined,
      success_url: `${baseUrl}/billing?checkout=success`,
      cancel_url: `${baseUrl}/billing`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    logger.error({ err }, "Checkout session error");
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Stripe customer portal (manage subscription, update card)
router.get("/portal", async (req, res) => {
  const userId = (req as any).userId as string;

  const [company] = await db
    .select({ stripeCustomerId: companiesTable.stripeCustomerId })
    .from(companiesTable)
    .where(eq(companiesTable.userId, userId));

  if (!company?.stripeCustomerId) {
    return res.status(400).json({ error: "No Stripe customer found" });
  }

  try {
    const stripe = await getUncachableStripeClient();
    const baseUrl =
      process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
        : "https://formate.co.nz";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: company.stripeCustomerId,
      return_url: `${baseUrl}/billing`,
    });

    return res.json({ url: portalSession.url });
  } catch (err) {
    logger.error({ err }, "Portal session error");
    return res.status(500).json({ error: "Failed to create portal session" });
  }
});

// Update the authenticated user's own plan when their subscription activates.
// Tenant is derived from the session — never trust a client-supplied userId.
router.post("/sync-subscription", async (req, res) => {
  const userId = (req as any).userId as string;
  const { subscriptionId, status } = req.body as {
    subscriptionId: string;
    status: string;
  };

  if (!subscriptionId) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const plan = status === "active" || status === "trialing" ? "founding" : "free";

  await db
    .update(companiesTable)
    .set({ stripeSubscriptionId: subscriptionId, plan })
    .where(eq(companiesTable.userId, userId));

  return res.json({ ok: true });
});

export default router;
