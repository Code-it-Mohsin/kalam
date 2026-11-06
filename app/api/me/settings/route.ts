import { NextRequest, NextResponse } from "next/server";
import { settingsSchema } from "@/lib/validation"
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-guard";

// GET THE USERS SETTINGS CONFIGURATION
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const settings = await db.userSettings.findUnique({
      where: { userId: auth.userId },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("GET /api/me/settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// CREATE OR UPDATE THE USER SETTINGS
export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid settings", details: parsed.error.flatten() }, { status: 400 });
    }

    const settings = await db.userSettings.upsert({
      where: { userId: auth.userId },
      create: {
        userId: auth.userId,
        ...parsed.data,
      },
      update: parsed.data,
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("PATCH /api/me/settings:", error);
    return NextResponse.json({ error: "Could not update settings" }, { status: 500 });
  }
}