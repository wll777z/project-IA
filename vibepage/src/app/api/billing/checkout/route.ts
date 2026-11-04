import { requireUser, apiError, HttpError } from "@/lib/http";
import {
  billingConfigured,
  getOrCreateCustomer,
  isValidMonthlyProPrice,
  stripe,
} from "@/lib/billing";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request, true);
    if (!billingConfigured)
      throw new HttpError(503, "Pagamento ainda não configurado.");
    const priceId = process.env.STRIPE_PRICE_PRO_MONTHLY!;
    const price = await stripe<{
      active: boolean;
      currency: string;
      unit_amount: number | null;
      recurring: { interval: string; interval_count: number } | null;
    }>(`prices/${encodeURIComponent(priceId)}`, undefined, "GET");
    if (!isValidMonthlyProPrice(price))
      throw new HttpError(
        503,
        "O plano Pro não está configurado corretamente para cobrança mensal de R$ 9,90.",
      );
    const origin = new URL(
      process.env.BETTER_AUTH_URL || "http://localhost:3000",
    ).origin;
    const customer = await getOrCreateCustomer(user);
    const session = await stripe<{ url: string }>("checkout/sessions", {
      mode: "subscription",
      customer,
      client_reference_id: user.id,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "subscription_data[metadata][userId]": user.id,
      allow_promotion_codes: "true",
      locale: "pt-BR",
      success_url: `${origin}/dashboard/conta?pagamento=sucesso`,
      cancel_url: `${origin}/dashboard/conta?pagamento=cancelado`,
    });
    return Response.json({ url: session.url });
  } catch (e) {
    return apiError(e);
  }
}
