import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [total, published, drafts, archived, recentPosts] =
      await Promise.all([
        db.post.count({ where: { authorId: auth.userId } }),

        db.post.count({
          where: { authorId: auth.userId, status: "PUBLISHED" },
        }),

        db.post.count({
          where: { authorId: auth.userId, status: "DRAFT" },
        }),

        db.post.count({
          where: { authorId: auth.userId, status: "ARCHIVED" },
        }),

        db.post.findMany({
          where: { authorId: auth.userId },
          orderBy: { updatedAt: "desc" },
          take: 5,
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            updatedAt: true,
          },
        }),
      ]);

    return NextResponse.json({
      statistics: { total, published, drafts, archived },
      recentActivity: recentPosts,
    });
  } catch (error) {
    console.error("GET /api/author/dashboard:", error);
    return NextResponse.json(
      { error: "Could not fetch dashboard" },
      { status: 500 },
    );
  }
}