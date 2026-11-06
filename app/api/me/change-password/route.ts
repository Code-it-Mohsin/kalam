import { NextRequest, NextResponse } from "next/server";
import { changePasswordSchema } from "@/lib/validation";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-guard";
import { hashPassword, verifyPassword } from "@/lib/auth-crypto";
import { revokeAllUserSessions, clearAuthCookies } from "@/lib/auth-session";

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid password data", details: parsed.error.flatten() }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { passwordHash: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Verify the existing password before changing it.
    const valid = await verifyPassword(user.passwordHash, parsed.data.currentPassword);

    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const newHash = await hashPassword(parsed.data.newPassword);

    await db.user.update({
      where: { id: auth.userId },
      data: { passwordHash: newHash },
    });

    // Revoke all sessions so existing logins must authenticate again.
    await revokeAllUserSessions(auth.userId);

    const response = NextResponse.json({ message: "Password changed successfully. Please sign in again." });
    clearAuthCookies(response);
    return response;
  } catch (error) {
    console.error("PATCH /api/me/change-password:", error);
    return NextResponse.json({ error: "Could not change password" }, { status: 500 });
  }
}