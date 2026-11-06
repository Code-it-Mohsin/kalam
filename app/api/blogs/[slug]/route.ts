
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// RETURN A SPECIFIC BLOG POST

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { slug } = await params;

    // FIND THE POST USING THE SLUG
    const post = await db.post.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
        visibility: "PUBLIC",
        publishedAt: { not: null },
      },

      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            bio: true,
          },
        },

        subjects: true,

        _count: {
          select: {
            comments: {
              where: { deletedAt: null },
            },
            likes: true,
            bookmarks: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("GET /api/blogs/[slug] error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
