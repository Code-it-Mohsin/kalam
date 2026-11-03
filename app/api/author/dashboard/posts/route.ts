import { NextRequest, NextResponse } from "next/server";
import { createPostSchema } from "@/lib/validation";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-guard";

function createSlug(title: string) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${base}-${randomUUID().slice(0, 8)}`;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = createPostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid post data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const post = await db.post.create({
      data: {
        authorId: auth.userId,
        title: data.title,
        slug: createSlug(data.title),
        excerpt: data.excerpt,
        content: data.content,
        coverImage: data.coverImage,
        status: data.status,
        visibility: data.visibility,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
        subjects: {
          connect: data.subjectIds.map((id) => ({ id })),
        },
      },
      include: { subjects: true },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("POST /api/author/posts:", error);
    return NextResponse.json(
      { error: "Could not create post" },
      { status: 500 },
    );
  }
}