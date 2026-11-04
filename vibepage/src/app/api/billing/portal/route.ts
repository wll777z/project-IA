import { db } from "@/lib/db";
import { requireUser, apiError, HttpError } from "@/lib/http";
import { billingConfigured, stripe } from "@/lib/billing";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request, true);
    if (!billingConfigured)
      throw new HttpError(503, "Pagamento ainda não configurado.");
    const ent = await db.entitlement.findUnique({ where: { userId: user.id } });
    if (!ent?.stripeCustomerId)
      throw new HttpError(404, "Nenhuma assinatura encontrada.");
    const origin = new URL(
      process.env.BETTER_AUTH_URL || "http://localhost:3000",
    ).origin;
    const session = await stripe<{ url: string }>("billing_portal/sessions", {
      customer: ent.stripeCustomerId,
      return_url: `${origin}/dashboard/conta`,
    });
    return Response.json({ url: session.url });
  } catch (e) {
    return apiError(e);
  }
}
