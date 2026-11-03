import { NextRequest, NextResponse } from "next/server";
import { createPostSchema } from "@/lib/validation";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-guard";

type Context = {
  params: Promise<{ id: string }>;
};

const updatePostSchema = createPostSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" },
);

async function getOwnedPost(id: string, userId: string) {
  return db.post.findFirst({
    where: {
      id,
      authorId: userId,
    },
  });
}

// GET - Fetch one of the author's posts
export async function GET(request: NextRequest, { params }: Context) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const post = await db.post.findFirst({
      where: { id, authorId: auth.userId },
      include: {
        subjects: true,
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("GET /api/author/posts/[id]:", error);
    return NextResponse.json(
      { error: "Could not fetch post" },
      { status: 500 },
    );
  }
}

// PUT - Replace the post's editable fields
export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingPost = await getOwnedPost(id, auth.userId);
    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
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

    const post = await db.post.update({
      where: { id },
      data: {
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        coverImage: data.coverImage,
        status: data.status,
        visibility: data.visibility,
        publishedAt:
          data.status === "PUBLISHED"
            ? existingPost.publishedAt ?? new Date()
            : null,
        ...(data.subjectIds !== undefined
          ? {
              subjects: {
                set: data.subjectIds.map((subjectId) => ({ id: subjectId })),
              },
            }
          : {}),
      },
      include: { subjects: true },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("PUT /api/author/posts/[id]:", error);
    return NextResponse.json(
      { error: "Could not replace post" },
      { status: 500 },
    );
  }
}

// PATCH - Update selected post fields
export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingPost = await getOwnedPost(id, auth.userId);
    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updatePostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid post data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const post = await db.post.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.excerpt !== undefined && { excerpt: data.excerpt }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
        ...(data.status !== undefined && {
          status: data.status,
          publishedAt:
            data.status === "PUBLISHED"
              ? existingPost.publishedAt ?? new Date()
              : null,
        }),
        ...(data.visibility !== undefined && { visibility: data.visibility }),
        ...(data.subjectIds !== undefined && {
          subjects: {
            set: data.subjectIds.map((subjectId) => ({ id: subjectId })),
          },
        }),
      },
      include: { subjects: true },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("PATCH /api/author/posts/[id]:", error);
    return NextResponse.json(
      { error: "Could not update post" },
      { status: 500 },
    );
  }
}

// DELETE - Delete an author's post
export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingPost = await getOwnedPost(id, auth.userId);
    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await db.post.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/author/posts/[id]:", error);
    return NextResponse.json(
      { error: "Could not delete post" },
      { status: 500 },
    );
  }
}