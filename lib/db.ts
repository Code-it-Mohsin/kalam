import "server-only";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { readFileSync } from "fs";
import path from "path";

const ca = readFileSync(path.join(process.cwd(), "certs", "postgres.pem"), "utf8");

const globalPrisma = globalThis as unknown as {
  db: PrismaClient | undefined;
};

function createClient() {
  const connectionString = new URL(process.env.POSTGRES_URL!);

  // Remove sslmode from the URL in memory, not from .env.local.
  connectionString.searchParams.delete("sslmode");

  const pool = new Pool({
    connectionString: connectionString.toString(),
    ssl: {
      ca,
      rejectUnauthorized: true,
    },
  });

  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

export const db = globalPrisma.db ?? createClient();

if (process.env.NODE_ENV !== "production") globalPrisma.db = db;