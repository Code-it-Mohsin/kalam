
import { NextRequest, NextResponse } from "next/server";

import { commentSchema } from "@/lib/validation";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-guard";

// GET AND POST COMMENTS AND REPLIES TO THOSE COMMENTS

type RouteContext = {
  params: Promise<{ slug: string }>;
};

// GET comments for a published public blog.
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;

    const limit = Number(searchParams.get("limit") ?? 20);
    const cursor = searchParams.get("cursor");

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 100" },
        { status: 400 }
      );
    }

    const post = await db.post.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
        visibility: "PUBLIC",
        publishedAt: { not: null },
      },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    const comments = await db.comment.findMany({
      where: {
        postId: post.id,
        parentId: null,
      },

      orderBy: [
        { createdAt: "asc" },
        { id: "asc" },
      ],

      take: limit + 1,

      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),

      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },

        replies: {
          where: {
            deletedAt: null,
          },

          orderBy: {
            createdAt: "asc",
          },

          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
      },
    });

    const hasMore = comments.length > limit;
    const results = comments.slice(0, limit);

    // Hide the original content of soft-deleted comments.
    const formattedComments = results.map((comment) => ({
      ...comment,
      content: comment.deletedAt
        ? "This comment has been deleted"
        : comment.content,
      user: comment.deletedAt ? null : comment.user,
    }));

    const nextCursor = hasMore
      ? results[results.length - 1].id
      : null;

    return NextResponse.json({
      comments: formattedComments,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("GET blog comments error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST a comment or reply. Authentication required.
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { slug } = await params;

    const body = await request.json().catch(() => null);
    const parsed = commentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid comment data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const post = await db.post.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
        visibility: "PUBLIC",
        publishedAt: { not: null },
      },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    // If this is a reply, ensure its parent belongs to this blog.
    if (parsed.data.parentId) {
      const parent = await db.comment.findFirst({
        where: {
          id: parsed.data.parentId,
          postId: post.id,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!parent) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    const comment = await db.comment.create({
      data: {
        content: parsed.data.content,
        parentId: parsed.data.parentId ?? null,
        userId: auth.userId,
        postId: post.id,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(
      { comment },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST blog comment error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
