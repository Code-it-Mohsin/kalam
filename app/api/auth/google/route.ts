// Sets the safety cookies and sends the browser to Google.
// Functions: GET
// app/api/auth/google/route.ts
// RESPONSIBILITY: kick off the Google flow: set one-time cookies, redirect.

import { NextResponse } from "next/server";
import {
  createAuthorizationRequest,
  getGoogleConfig,
  setOAuthCookies,
} from "@/lib/google-oauth";

export async function GET() {
  const config = getGoogleConfig();
  if (!config) {
    return NextResponse.json({ error: "Google OAuth is not configured" }, { status: 500 });
  }

  // state + PKCE verifier + nonce are generated in lib; the route just plugs them into the redirect and the cookies.
  
  const { url, state, verifier, nonce } = createAuthorizationRequest(config);

  const response = NextResponse.redirect(url);
  setOAuthCookies(response, { state, verifier, nonce });
  return response;
}

// WE'LL TRY TO MAKE THE FLOW CHART IF IT HAPPENS WITHIN 8:00 - 9:30 GOOD
// ELSE WE'LL SWITCH TO CODE, the auth no its own


