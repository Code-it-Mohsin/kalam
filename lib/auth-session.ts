// Manages a login's life: creates the session in the database, swaps the refresh token for a new one, revokes it, and handles the cookies.

import "server-only"
import { type NextResponse } from "next/server"
import type { Prisma } from "./generated/prisma/client"
import { db } from "@/lib/db"
import { createAccessToken, createRefreshToken, hashRefreshToken } from "@/lib/auth-crypto"

// COOKIE NAMES
// FIX: exported. The refresh and signout routes import REFRESH_COOKIE from here.
export const ACCESS_COOKIE = "kalam_access"
export const REFRESH_COOKIE = "kalam_refresh"

// TTL CONFIG
// FIX: Number(undefined) is NaN, which would silently create "Invalid Date" sessions
// and broken cookies. Fail at startup instead if an env var is missing or not a number.
function requirePositiveNumber(name: string) {
  const value = Number(process.env[name])
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be set to a positive number`)
  }
  return value
}

const ACCESS_TTL_SECONDS = requirePositiveNumber("TTL_SEC_ACCESS_TOKENS")
const REFRESH_TTL_SECONDS = requirePositiveNumber("TTL_DAYS_REFRESH_TOKENS") * 24 * 60 * 60

// Kept as an export since you had it exported; used for DB expiry dates (milliseconds)
export const REFRESH_SESSION_MS = REFRESH_TTL_SECONDS * 1000

// A used refresh token seen again within this window is a parallel request, not theft
const REUSE_GRACE_MS = 10_000

// BASE CONFIG COOKIE
const BASE_COOKIE = {
  httpOnly: true, // JavaScript on the page can't read it, so XSS can't steal it
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  sameSite: "lax" as const, // not sent on cross-site POSTs, which blocks basic CSRF
}

// COOKIE MANAGEMENT
export function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  response.cookies.set(ACCESS_COOKIE, accessToken, {
    ...BASE_COOKIE,
    path: "/",
    maxAge: ACCESS_TTL_SECONDS,
  })
  response.cookies.set(REFRESH_COOKIE, refreshToken, {
    ...BASE_COOKIE,
    path: "/api/auth",
    maxAge: REFRESH_TTL_SECONDS,
  })
}

export function clearAuthCookies(response: NextResponse) {
  // path must match the one used in setAuthCookies, or the browser won't clear it
  response.cookies.set(ACCESS_COOKIE, "", { ...BASE_COOKIE, path: "/", maxAge: 0 })
  response.cookies.set(REFRESH_COOKIE, "", { ...BASE_COOKIE, path: "/api/auth", maxAge: 0 })
}

// SESSION CREATION
export async function createLoginSession(
  userId: string,
  metadata?: { userAgent?: string; ipAddress?: string },
) {
  const expiresAt = new Date(Date.now() + REFRESH_SESSION_MS)
  // auth-crypto's createRefreshToken is async, so it must be awaited
  const refreshToken = await createRefreshToken()

  const session = await db.session.create({
    data: {
      userId,
      expiresAt,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
      refreshTokens: {
        // only the hash is stored, never the raw token
        create: { tokenHash: await hashRefreshToken(refreshToken), expiresAt },
      },
    },
    select: { id: true },
  })

  const accessToken = await createAccessToken(userId, session.id)
  return {
    sessionId: session.id,
    accessToken,
    refreshToken,
  }
}

// META DATA
export function getRequestMetadata(request: Request) {
  // Informational only: x-forwarded-for can be faked unless you're behind a trusted proxy. Delete these lines if you
  // don't want to store IPs.
  const forwarded = request.headers.get("x-forwarded-for")
  return {
    userAgent: request.headers.get("user-agent")?.slice(0, 255) ?? undefined,
    ipAddress: forwarded?.split(",")[0]?.trim() || undefined,
  }
}

// REFRESH TOKEN ROTATION
export type RotateResult =
  | { ok: true; userId: string; sessionId: string; refreshToken: string }
  | { ok: false; reason: "invalid" | "reused" | "concurrent" }

// "kill the whole session" helper: it revokes the session and all its tokens.
async function revokeSessionTree(
  tx: Prisma.TransactionClient,
  sessionId: string,
  now: Date,
) {
  await tx.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: now },
  })
  await tx.refreshToken.updateMany({
    where: { sessionId, revokedAt: null },
    data: { revokedAt: now },
  })
}

export async function revokeRefreshSession(rawToken: string) {
  const stored = await db.refreshToken.findUnique({
    where: { tokenHash: await hashRefreshToken(rawToken) },
    select: { sessionId: true },
  })
  if (!stored) return

  const now = new Date()
  await db.$transaction((tx) => revokeSessionTree(tx, stored.sessionId, now))
}

export async function rotateRefreshToken(rawToken: string): Promise<RotateResult> {
  const tokenHash = await hashRefreshToken(rawToken)
  const now = new Date()

  return db.$transaction(async (tx): Promise<RotateResult> => {
    const stored = await tx.refreshToken.findUnique({
      where: { tokenHash },
      include: { session: true },
    })
    if (!stored) return { ok: false, reason: "invalid" }

    const { session } = stored
    if (session.revokedAt || session.expiresAt <= now) return { ok: false, reason: "invalid" }

    // Token was already used: either two tabs racing, or a stolen copy
    if (stored.usedAt) {
      if (now.getTime() - stored.usedAt.getTime() < REUSE_GRACE_MS) {
        return { ok: false, reason: "concurrent" }
      }

      await revokeSessionTree(tx, session.id, now)
      return { ok: false, reason: "reused" }
    }

    if (stored.revokedAt) return { ok: false, reason: "invalid" }

    // Only one parallel request can flip usedAt from null, so only one wins
    const claimed = await tx.refreshToken.updateMany({
      where: { id: stored.id, usedAt: null, revokedAt: null },
      data: { usedAt: now },
    })
    if (claimed.count !== 1) return { ok: false, reason: "concurrent" }

    const nextToken = await createRefreshToken() // FIX: renamed from nexToken
    await tx.refreshToken.create({
      data: {
        sessionId: session.id,
        tokenHash: await hashRefreshToken(nextToken),
        expiresAt: session.expiresAt,
      },
    })

    return {
      ok: true,
      userId: session.userId,
      sessionId: session.id,
      refreshToken: nextToken,
    }
  })
}
//