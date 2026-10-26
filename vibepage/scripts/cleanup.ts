import "dotenv/config";
import { db } from "../src/lib/db";
try {
  const now = new Date();
  const result = await db.$transaction([
    db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.verification.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.rateLimit.deleteMany({
      where: { lastRequest: { lt: BigInt(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
  ]);
  console.log(
    "Registros expirados removidos:",
    result.map((r) => r.count),
  );
} finally {
  await db.$disconnect();
}
