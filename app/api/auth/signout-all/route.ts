
import { NextRequest, NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/auth-crypto"
import {
  clearAuthCookies,
  revokeAllUserSessions,
} from "@/lib/auth-session"

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("kalam_access")?.value

  if (!accessToken) {
    const response = NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
    clearAuthCookies(response)
    return response
  }

  let payload

  try {
    payload = await verifyAccessToken(accessToken)
  } catch {
    payload = null
  }

  if (!payload) {
    const response = NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
    clearAuthCookies(response)
    return response
  }

  const userId = payload.userId

  if (!userId) {
    const response = NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
    clearAuthCookies(response)
    return response
  }

  try {
    await revokeAllUserSessions(userId)
  } catch (error) {
    console.error("Signout-all revocation failed:", error)
    return NextResponse.json(
      { error: "Failed to revoke sessions" },
      { status: 500 }
    )
  }
  const response = NextResponse.json({
    message: "Signed out of all sessions",
  })

  clearAuthCookies(response)
  return response
}
