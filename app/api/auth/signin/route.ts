// Receives email and password, checks them, logs the user in, and sends back the cookies.
// // Functions: POST

// app/api/auth/signin/route.ts
// RESPONSIBILITY: HTTP glue only: parse -> validate -> verify credentials -> start session.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth-crypto";
import { signinSchema } from "@/lib/validation";
import {
  createLoginSession,
  getRequestMetadata,
  setAuthCookies,
} from "@/lib/auth-session";

// TODO: rate-limit / lock out by IP + email to stop credential stuffing.

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = signinSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });

  // DATABASE OR SESSION ERRORS ARE NOT CAUGHT CURRENTLY
      
  const valid = await verifyPassword(user?.passwordHash, password);

  if (!user || !valid) {
    // One message for every failure: no hint about which part was wrong.
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const tokens = await createLoginSession(user.id, getRequestMetadata(request));

  const response = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email },
  });
  setAuthCookies(response, tokens.accessToken, tokens.refreshToken);
  return response;
}