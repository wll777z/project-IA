import { afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { verifyStripeSignature } from "../src/lib/billing";
import { POST as receiveWebhook } from "../src/app/api/billing/webhook/route";

const secret = "whsec_test";
const sign = (payload: string, t: number) =>
  `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex")}`;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("webhook Stripe", () => {
  it("aceita assinatura válida", () => {
    expect(verifyStripeSignature("{}", sign("{}", 1000), secret, 1000)).toBe(
      true,
    );
  });
  it("rejeita payload alterado", () => {
    expect(
      verifyStripeSignature('{"x":1}', sign("{}", 1000), secret, 1000),
    ).toBe(false);
  });
  it("rejeita evento com mais de 5 minutos", () => {
    expect(verifyStripeSignature("{}", sign("{}", 1000), secret, 1301)).toBe(
      false,
    );
  });

  it("trata JSON inválido como evento inválido, sem derrubar a rota", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", secret);
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = "not-json";
    const response = await receiveWebhook(
      new Request("http://localhost/api/billing/webhook", {
        method: "POST",
        headers: { "stripe-signature": sign(payload, timestamp) },
        body: payload,
      }),
    );
    expect(response.status).toBe(400);
  });

  it("mantém checkout desligado até habilitação e configuração completa", async () => {
    vi.stubEnv("PAYMENTS_ENABLED", "false");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_synthetic");
    vi.stubEnv("STRIPE_PRICE_PRO_MONTHLY", "price_synthetic");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", secret);
    const { billingConfigured } = await import("../src/lib/billing");
    expect(billingConfigured).toBe(false);
  });

  it("não abre checkout sem segredo de webhook", async () => {
    vi.stubEnv("PAYMENTS_ENABLED", "true");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_synthetic");
    vi.stubEnv("STRIPE_PRICE_PRO_MONTHLY", "price_synthetic");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    const { billingConfigured } = await import("../src/lib/billing");
    expect(billingConfigured).toBe(false);
  });

  it("habilita o checkout somente com opt-in e os três segredos/IDs", async () => {
    vi.stubEnv("PAYMENTS_ENABLED", "true");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_synthetic");
    vi.stubEnv("STRIPE_PRICE_PRO_MONTHLY", "price_synthetic");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", secret);
    const { billingConfigured } = await import("../src/lib/billing");
    expect(billingConfigured).toBe(true);
  });

  it("aceita somente preço recorrente ativo de R$ 9,90 por mês", async () => {
    const { isValidMonthlyProPrice } = await import("../src/lib/billing");
    const price = {
      active: true,
      currency: "brl",
      unit_amount: 990,
      recurring: { interval: "month", interval_count: 1 },
    };
    expect(isValidMonthlyProPrice(price)).toBe(true);
    expect(isValidMonthlyProPrice({ ...price, unit_amount: 1000 })).toBe(false);
    expect(isValidMonthlyProPrice({ ...price, currency: "usd" })).toBe(false);
    expect(
      isValidMonthlyProPrice({
        ...price,
        recurring: { interval: "year", interval_count: 1 },
      }),
    ).toBe(false);
    expect(isValidMonthlyProPrice({ ...price, active: false })).toBe(false);
  });
});
