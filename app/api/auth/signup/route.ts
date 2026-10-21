// app/api/auth/signup/route.ts
// RESPONSIBILITY: HTTP glue only: parse -> validate -> create user -> start session -> respond.
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth-crypto";

import { signupSchema } from "@/lib/validation";
import {
  createLoginSession,
  getRequestMetadata,
  setAuthCookies,
} from "@/lib/auth-session";

// TODO: rate-limit by IP (and email) before shipping; argon2 hashing is
// deliberately expensive, which makes this endpoint cheap to abuse.

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null); // malformed JSON -> null -> fails validation
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid signup details" }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  try {
    const user = await db.user.create({
      data: { name, email, passwordHash: await hashPassword(password) },
      select: { id: true, name: true, email: true }, // never return passwordHash
    });

    const tokens = await createLoginSession(user.id, getRequestMetadata(request));

    const response = NextResponse.json({ user }, { status: 201 });
    setAuthCookies(response, tokens.accessToken, tokens.refreshToken);
    return response;
  } catch (error) {
    // Relying on the DB unique constraint (not check-then-insert) is correct:
    // it is race-free.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // Trade-off: this reveals that an email is registered. Acceptable for
      // most apps; the strict alternative is "check your email" for both cases.
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409 },
      );
    }

    // IMPROVED: log the real error server-side. The old code logged a fixed
    // string, which makes production failures impossible to debug.
    console.error("Signup failed:", error);
    return NextResponse.json({ error: "Unable to create account" }, { status: 500 });
  }
}