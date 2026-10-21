import "server-only";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
// Same generated client the rest of the code imports `Prisma` from
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalPrisma = globalThis as unknown as {
  db: PrismaClient | undefined;
};

function createClient() {
  // Pool is created inside the factory, so it's only built when a new client is.
  // Before, every dev hot-reload opened a new Pool while reusing the old client.
  const pool = new Pool({ connectionString: process.env.POSTGRES_URL! });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

export const db = globalPrisma.db ?? createClient();

if (process.env.NODE_ENV !== "production") globalPrisma.db = db;