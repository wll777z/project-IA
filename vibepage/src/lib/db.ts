import { databaseOptions } from "@/lib/database-options";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
const globalDb = globalThis as unknown as { prisma?: PrismaClient };
export const db =
  globalDb.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(databaseOptions()),
  });
if (process.env.NODE_ENV !== "production") globalDb.prisma = db;
