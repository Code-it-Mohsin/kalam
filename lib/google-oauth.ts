// Handles the Google part only: building the login URL, the safety cookies, trading the code for an identity, and checking it is real. It never touches your database.

// Functions:
// getGoogleConfig
// getAppUrl
// createAuthorizationRequest
// setOAuthCookies
// readOAuthCookies
// clearOAuthCookies
// exchangeCodeForIdentity

import "server-only"

import { createHash, randomBytes } from "node:crypto"
import { createRemoteJWKSet, jwtVerify } from "jose"
import type { NextRequest, NextResponse } from "next/server"


export type GoogleConfig = {
  clientId: string,
  clientSecret: string,
  redirectUri: string,
}

export type GoogleIdentity = {
  googleId: string,
  email: string,
  name: string | null,
  picture: string | null,
}

export const OAUTH_STATE_COOKIE = "google_oauth_state"
export const OAUTH_VERIFIER_COOKIE = "google_pkce_verifier"
export const OAUTH_NONCE_COOKIE = "google_oauth_nonce"

const OAUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth/google"
}

const googleKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth/v3/certs")
)

export function getGoogleConfig(): GoogleConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback"

  if (!clientId || !clientSecret || !redirectUri) return null
  return { clientId, clientSecret, redirectUri }
}

export function getAppUrl(request: NextRequest) {
  return process.env.APP_URL ?? request.nextUrl.origin
}

// =================== STEP 1. START =================

export function createAuthorizationRequest(config: GoogleConfig) {
  const state = randomBytes(32).toString("base64url") // protection against forged login callback - CSRF protection
  const verifier = randomBytes(32).toString("base64url") // PKCE random password that was sent as hash earlier
  const nonce = randomBytes(32).toString("base64url")
  const challenge = createHash("sha256").update(verifier).digest("base64url")

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256"
  }).toString()

  return { url, state, verifier, nonce }
}

export function setOAuthCookies(response: NextResponse, values: {
  state: string, verifier: string, nonce: string
}) {
  const options = { ...OAUTH_COOKIE_OPTIONS, maxAge: 600 }
  response.cookies.set(OAUTH_STATE_COOKIE, values.state, options)
  response.cookies.set(OAUTH_VERIFIER_COOKIE, values.verifier, options)
  response.cookies.set(OAUTH_NONCE_COOKIE, values.nonce, options)
}

// =================== STEP 2. READ AUTH COOKIES =================

export function readOAuthCookies(request: NextRequest) {
  const state = request.cookies.get(OAUTH_STATE_COOKIE)?.value
  const verifier = request.cookies.get(OAUTH_VERIFIER_COOKIE)?.value
  const nonce = request.cookies.get(OAUTH_NONCE_COOKIE)?.value
  if (!state || !verifier || !nonce) return null
  return { state, verifier, nonce }
}

export function clearOAuthCookies(response: NextResponse) {
  for (const name of [OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, OAUTH_NONCE_COOKIE]) {
    response.cookies.set(name, "", { ...OAUTH_COOKIE_OPTIONS, maxAge: 0 })
  }
}

export async function exchangeCodeForIdentity(config: GoogleConfig, code: string, verifier: string, nonce: string): Promise<GoogleIdentity | null> {
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: 'POST',
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000)
    })
    if (!tokenResponse.ok) return null

    const { id_token } = (await tokenResponse.json()) as { id_token?: string }
    if (!id_token) return null

    const { payload } = await jwtVerify(id_token, googleKeys, {
      algorithms: ["RS256"],
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: config.clientId
    })

    if (payload.nonce !== nonce) return null

    if (!payload.sub || typeof payload.email !== "string" || payload.email_verified !== true) return null

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      name: typeof payload.name === "string" ? payload.name : null,
      picture: typeof payload.picture === "string" ? payload.picture : null
    }
  } catch (error) {
    return null
  }
}


