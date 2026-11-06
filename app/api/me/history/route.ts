import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 50);
    const cursor = searchParams.get("cursor");

    const history = await db.readingHistory.findMany({
      where: { userId: auth.userId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { lastReadAt: "desc" },
      include: {
        post: {
          include: {
            author: {
              select: { id: true, name: true, username: true, image: true },
            },
            subjects: true,
          },
        },
      },
    });

    const hasMore = history.length > limit;
    const results = hasMore ? history.slice(0, limit) : history;
    const nextCursor = hasMore ? results[results.length - 1].id : null;

    return NextResponse.json({
      history: results,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("GET /api/me/history:", error);
    return NextResponse.json({ error: "Could not fetch reading history" }, { status: 500 });
  }
}