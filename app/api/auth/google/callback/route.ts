// Google sends the user back here. It runs the checks, finds or creates the user, logs them in, and redirects to /dashboard.
// Functions: GET - fail (a small local helper inside it that redirects to the signin page with an error and clears the Google cookies)

// app/api/auth/google/callback/route.ts
// RESPONSIBILITY: orchestrate the callback by calling three collaborators:
//   google-oauth.ts    -> "is this a genuine, verified Google identity?"
//   account-linking.ts -> "which of our users is that?"
//   auth-session.ts    -> "log that user in"
// IMPROVED: down from ~200 lines of mixed protocol/DB/session code to a
// readable top-to-bottom flow.
import { NextRequest, NextResponse } from "next/server";
import {
  clearOAuthCookies,
  exchangeCodeForIdentity,
  getAppUrl,
  getGoogleConfig,
  readOAuthCookies,
} from "@/lib/google-oauth";

import { findOrCreateUserForGoogle } from "@/lib/account-linking";
import {
  createLoginSession,
  getRequestMetadata,
  setAuthCookies,
} from "@/lib/auth-session";

// GET REQUEST COMING FROM THE BROWSER WITH GOOGLE'S CODE
export async function GET(request: NextRequest) {
  const appUrl = getAppUrl(request);

  // declared here as the url is currently in this scope
  const fail = () => {
    const response = NextResponse.redirect(new URL("/signin?error=google", appUrl));
    clearOAuthCookies(response);
    return response;
  };

  const config = getGoogleConfig();
  if (!config) {
    return NextResponse.json({ error: "Google OAuth is not configured" }, { status: 500 });
  }

  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const returnedState = params.get("state");
  const saved = readOAuthCookies(request);

  // Reject: user denied consent, missing params/cookies, or state mismatch (CSRF).
  if (params.has("error") || !code || !returnedState || !saved || returnedState !== saved.state) {
    return fail();
  }

  // Code exchange + ID token verification (signature, issuer, audience,
  // nonce, verified email). Null means "don't trust this".
  const identity = await exchangeCodeForIdentity(config, code, saved.verifier, saved.nonce);
  if (!identity) return fail();

  try {
    const userId = await findOrCreateUserForGoogle(identity);
    const tokens = await createLoginSession(userId, getRequestMetadata(request));

    const response = NextResponse.redirect(new URL("/dashboard", appUrl));
    clearOAuthCookies(response);
    setAuthCookies(response, tokens.accessToken, tokens.refreshToken);
    return response;
  } catch (error) {

    // ADD REDIRECT TO THE SIGN IN PAGE

    console.error("Google sign-in failed:", error); // IMPROVED: errors were swallowed
    return fail();
  }
}