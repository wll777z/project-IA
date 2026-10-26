import "dotenv/config";
import { db } from "../src/lib/db";
const [email, plan, expiry] = process.argv.slice(2);
try {
  if (!email || !["FREE", "PRO"].includes(plan))
    throw new Error("Uso: npm run admin:plan -- email FREE|PRO [AAAA-MM-DD]");
  const expiresAt = expiry ? new Date(expiry + "T23:59:59.999Z") : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime()))
    throw new Error("Data inválida");
  const user = await db.user.findUniqueOrThrow({
    where: { email: email.toLowerCase() },
  });
  await db.entitlement.upsert({
    where: { userId: user.id },
    create: { userId: user.id, plan: plan as "FREE" | "PRO", expiresAt },
    update: { plan: plan as "FREE" | "PRO", expiresAt },
  });
  console.log(
    "Permissão administrativa atualizada. Nenhum pagamento foi realizado.",
  );
} finally {
  await db.$disconnect();
}
