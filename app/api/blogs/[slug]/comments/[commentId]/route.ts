
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-guard";

type RouteContext = {
  params: Promise<{
    slug: string;
    commentId: string;
  }>;
};

const updateCommentSchema = z.object({
  content: z.string().trim().min(1).max(5000),
});

// PATCH: Edit your own comment.
export async function PATCH(
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

    const { slug, commentId } = await params;

    const body = await request.json().catch(() => null);
    const parsed = updateCommentSchema.safeParse(body);

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

    // Only update a comment owned by the authenticated user.
    const result = await db.comment.updateMany({
      where: {
        id: commentId,
        postId: post.id,
        userId: auth.userId,
        deletedAt: null,
      },

      data: {
        content: parsed.data.content,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    const comment = await db.comment.findUnique({
      where: { id: commentId },

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

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("PATCH blog comment error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Soft-delete your own comment.
export async function DELETE(
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

    const { slug, commentId } = await params;

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

    // Set deletedAt instead of physically deleting the comment.
    const result = await db.comment.updateMany({
      where: {
        id: commentId,
        postId: post.id,
        userId: auth.userId,
        deletedAt: null,
      },

      data: {
        deletedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("DELETE blog comment error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
