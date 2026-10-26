import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
try {
  for (const [id, name, premium] of [
    ["midnight-purple", "Midnight Purple", false],
    ["cyber-neon", "Cyber Neon", true],
    ["minimal-black", "Minimal Black", false],
    ["pink-dream", "Pink Dream", true],
    ["ice-blue", "Ice Blue", false],
  ] as const) {
    await db.theme.upsert({
      where: { id },
      create: { id, name, premium },
      update: { name, premium },
    });
  }
} finally {
  await db.$disconnect();
}
