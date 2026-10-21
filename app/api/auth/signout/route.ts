// Ends this device’s session and clears the cookies.
// Functions: POST
// app/api/auth/signout/route.ts
// RESPONSIBILITY: HTTP glue only: revoke this device's session, clear cookies.
import { NextRequest, NextResponse } from "next/server";
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  revokeRefreshSession,
} from "@/lib/auth-session";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    // IMPROVED: a DB hiccup used to bubble up as a 500 and leave the user's
    // cookies in place, so the sign-out button appeared to do nothing.
    // Now the browser is always signed out locally; the failure is logged.
    // (Trade-off: the server-side session may survive until it expires.)
    try {
      await revokeRefreshSession(refreshToken);
    } catch (error) {
      console.error("Signout revoke failed:", error);
    }
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}