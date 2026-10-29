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

  // Unlike Express's express.json() middleware, Next.js requires request.json() to parse the body; catch malformed/typos JSON to prevent an unhandled error.
  const body = await request.json().catch(() => null); 

  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    console.log("invalid details")
    return NextResponse.json({ error: "Invalid signup details" }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  try {
    console.log("Creating user in db ")
    const user = await db.user.create({
      data: { name, email, passwordHash: await hashPassword(password) },
      select: { id: true, name: true, email: true }, 
    });

    const tokens = await createLoginSession(user.id, getRequestMetadata(request));

    const response = NextResponse.json({ user }, { status: 201 });
    setAuthCookies(response, tokens.accessToken, tokens.refreshToken);
    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      
      // HANDLE WITH AN EXPLICIT ACCOUNT/SESSION RECOVERY STRATEGY

      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409 },
      );
    }

    console.error("Signup failed:", error);
    return NextResponse.json({ error: "Unable to create account" }, { status: 500 });
  }
}