import "dotenv/config";
import { themes } from "../src/lib/themes";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
try {
  for (const { id, name, premium } of themes) {
    await db.theme.upsert({
      where: { id },
      create: { id, name, premium },
      update: { name, premium },
    });
  }
} finally {
  await db.$disconnect();
}
