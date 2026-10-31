
import "server-only";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAccessToken } from "@/lib/auth-crypto";

export type AuthIdentity = {
  userId: string;
  sessionId: string;
};

export async function authenticateRequest(
  request: NextRequest
): Promise<AuthIdentity | null> {
  const token = request.cookies.get("kalam_access")?.value;

  if (!token) return null;

  try {
    const payload = await verifyAccessToken(token);

    if (!payload?.userId || !payload.sessionId) {
      return null;
    }

    const session = await db.session.findFirst({
      where: {
        id: payload.sessionId,
        userId: payload.userId,
        revokedAt: null,
      },
      select: { id: true },
    });

    if (!session) return null;

    return {
      userId: payload.userId,
      sessionId: session.id,
    };
  } catch {
    return null;
  }
}
