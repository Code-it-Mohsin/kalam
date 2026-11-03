import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-guard";

const statusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit")) || 20, 1),
      50,
    );
    const cursor = searchParams.get("cursor");

    if (status && !statusSchema.safeParse(status).success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const posts = await db.post.findMany({
      where: {
        authorId: auth.userId,
        ...(status ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : {}),
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { updatedAt: "desc" },
      include: {
        subjects: true,
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });

    const hasMore = posts.length > limit;
    const results = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? results[results.length - 1].id : null;

    return NextResponse.json({ posts: results, nextCursor, hasMore });
  } catch (error) {
    console.error("GET /api/author/dashboard/posts:", error);
    return NextResponse.json(
      { error: "Could not fetch posts" },
      { status: 500 },
    );
  }
}