import { NextRequest, NextResponse } from "next/server";
import { profileSchema } from "@/lib/validation"
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-guard";
import { revokeAllUserSessions, clearAuthCookies } from "@/lib/auth-session";

// FIND THE USER AND GET THEIR DETAILS
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/me:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// FIND THE USER AND UPDATE ITS PROFILE DETAILS
export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid profile data", details: parsed.error.flatten() }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id: auth.userId },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("PATCH /api/me:", error);
    return NextResponse.json({ error: "Could not update profile" }, { status: 500 });
  }
}

// FIND THE USER REVOKE SESSIONS AND DELETE ITS PROFILES ETC
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Revoke sessions before deleting the account.
    await revokeAllUserSessions(auth.userId);

    await db.user.delete({
      where: { id: auth.userId },
    });

    const response = NextResponse.json({ message: "Account deleted successfully" });
    clearAuthCookies(response);
    return response;
  } catch (error) {
    console.error("DELETE /api/me:", error);
    return NextResponse.json({ error: "Could not delete account" }, { status: 500 });
  }
}