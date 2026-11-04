import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

export const billingEnabled = process.env.PAYMENTS_ENABLED === "true";
export const billingConfigured = Boolean(
  billingEnabled &&
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_PRICE_PRO_MONTHLY &&
  process.env.STRIPE_WEBHOOK_SECRET,
);

export function isValidMonthlyProPrice(price: {
  active: boolean;
  currency: string;
  unit_amount: number | null;
  recurring: { interval: string; interval_count: number } | null;
}) {
  return (
    price.active &&
    price.currency.toLowerCase() === "brl" &&
    price.unit_amount === 990 &&
    price.recurring?.interval === "month" &&
    price.recurring?.interval_count === 1
  );
}

const ACTIVE = new Set(["active", "trialing", "past_due"]);

export async function stripe<T = Record<string, unknown>>(
  path: string,
  params?: Record<string, string>,
  method: "GET" | "POST" = "POST",
): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe não configurado");
  const body = params ? new URLSearchParams(params).toString() : undefined;
  const url =
    method === "GET" && body
      ? `https://api.stripe.com/v1/${path}?${body}`
      : `https://api.stripe.com/v1/${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: method === "POST" ? body : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) {
    console.error("STRIPE_REQUEST_FAILED", path, res.status);
    throw new Error("Pagamento temporariamente indisponível.");
  }
  return json;
}

export async function getOrCreateCustomer(user: {
  id: string;
  email: string;
  name?: string | null;
}) {
  const existing = await db.entitlement.findUnique({
    where: { userId: user.id },
  });
  if (existing?.stripeCustomerId) return existing.stripeCustomerId;
  const customer = await stripe<{ id: string }>("customers", {
    email: user.email,
    ...(user.name ? { name: user.name } : {}),
    "metadata[userId]": user.id,
  });
  await db.entitlement.upsert({
    where: { userId: user.id },
    create: { userId: user.id, stripeCustomerId: customer.id },
    update: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

/** Verifica o cabeçalho Stripe-Signature (esquema v1, tolerância 5 min). */
export function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  now = Math.floor(Date.now() / 1000),
) {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => p.split("=") as [string, string]),
  );
  const t = Number(parts.t);
  const sigs = header
    .split(",")
    .filter((p) => p.startsWith("v1="))
    .map((p) => p.slice(3));
  if (!t || !sigs.length || Math.abs(now - t) > 300) return false;
  const expected = createHmac("sha256", secret)
    .update(`${t}.${payload}`)
    .digest("hex");
  return sigs.some(
    (s) =>
      s.length === expected.length &&
      timingSafeEqual(Buffer.from(s), Buffer.from(expected)),
  );
}

type Subscription = {
  id: string;
  customer: string;
  status: string;
  current_period_end?: number;
  items?: { data?: { current_period_end?: number }[] };
  metadata?: { userId?: string };
};

/** Sincroniza o plano a partir do estado atual da assinatura no Stripe. */
export async function syncSubscription(sub: Subscription) {
  const periodEnd =
    sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  const active = ACTIVE.has(sub.status);
  const where = sub.metadata?.userId
    ? { userId: sub.metadata.userId }
    : { stripeCustomerId: sub.customer };
  const found = await db.entitlement.findFirst({ where });
  if (!found) return;
  await db.entitlement.update({
    where: { id: found.id },
    data: {
      stripeCustomerId: sub.customer,
      stripeSubscriptionId: sub.id,
      subscriptionStatus: sub.status,
      plan: active ? "PRO" : "FREE",
      // margem de 2 dias para renovação processar
      expiresAt:
        active && periodEnd
          ? new Date((periodEnd + 2 * 86400) * 1000)
          : active
            ? null
            : new Date(),
    },
  });
}
