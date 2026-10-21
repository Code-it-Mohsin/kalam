// refresh/route.ts: Swaps the old refresh token for a new one and issues a fresh login token when the 15-minute one expires.
// Functions: POST


// app/api/auth/refresh/route.ts
// RESPONSIBILITY: HTTP glue only. All rotation/theft logic lives in auth-session.ts.
import { NextRequest, NextResponse } from "next/server";
import { createAccessToken } from "@/lib/auth-crypto";
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  rotateRefreshToken,
  setAuthCookies,
} from "@/lib/auth-session";

export async function POST(request: NextRequest) {
  const oldToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!oldToken) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const result = await rotateRefreshToken(oldToken);

    if (!result.ok) {
      // IMPROVED: a parallel request (second tab, StrictMode double-fetch)
      // lost the race. The winner already set fresh cookies, so we must NOT
      // clear them. Tell the client to simply retry its request.
      if (result.reason === "concurrent") {
        return NextResponse.json({ error: "Refresh already in progress" }, { status: 409 });
      }

      // "invalid" or "reused": the session is dead, so log this browser out.
      const response = NextResponse.json(
        { error: "Session expired or invalid" },
        { status: 401 },
      );
      clearAuthCookies(response);
      return response;
    }

    const accessToken = await createAccessToken(result.userId, result.sessionId);

    const response = NextResponse.json({ ok: true });
    setAuthCookies(response, accessToken, result.refreshToken);
    return response;
  } catch (error) {
    console.error("Refresh failed:", error); // IMPROVED: was swallowed silently
    return NextResponse.json({ error: "Unable to refresh session" }, { status: 500 });
  }
}