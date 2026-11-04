import { stripe, syncSubscription, verifyStripeSignature } from "@/lib/billing";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook não configurado", { status: 503 });
  const payload = await request.text();
  if (
    !verifyStripeSignature(
      payload,
      request.headers.get("stripe-signature"),
      secret,
    )
  )
    return new Response("Assinatura inválida", { status: 400 });

  let event: {
    type: string;
    data?: { object?: Record<string, unknown> };
  };
  try {
    event = JSON.parse(payload);
  } catch {
    return new Response("Evento inválido", { status: 400 });
  }
  if (!event.type || !event.data?.object)
    return new Response("Evento inválido", { status: 400 });
  try {
    const obj = event.data.object;
    if (event.type === "checkout.session.completed" && obj.subscription) {
      // Busca o estado oficial da assinatura em vez de confiar no evento.
      const sub = await stripe(
        `subscriptions/${obj.subscription}`,
        undefined,
        "GET",
      );
      await syncSubscription(sub as never);
    } else if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await syncSubscription(obj as never);
    }
    return Response.json({ received: true });
  } catch {
    console.error("STRIPE_WEBHOOK_FAILED", event.type);
    return new Response("Erro ao processar", { status: 500 });
  }
}
