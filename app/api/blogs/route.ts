
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET THE LIMIT AMOUNT OF POSTS FROM DB

export async function GET(request: NextRequest) {
  try {

    // GET THE PARAMETERS FROM THE REQUEST
    const searchParams = request.nextUrl.searchParams;
    const limit = Number(searchParams.get("limit") ?? 10);
    const cursor = searchParams.get("cursor");
    const author = searchParams.get("author");
    const subject = searchParams.get("subject");
    const search = searchParams.get("search")?.trim();

    // Validate pagination limit.
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 50" },
        { status: 400 }
      );
    }

    // LIMIT THE LENGTH OF THE SEARCH
    if (search && search.length > 100) {
      return NextResponse.json(
        { error: "Search must be 100 characters or fewer" },
        { status: 400 }
      );
    }

    // FIND THE POST IN THE DB
    const posts = await db.post.findMany({
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
        publishedAt: { not: null },

        ...(author && {
          author: {
            is: { username: author },
          },
        }),

        ...(subject && {
          subjects: {
            some: { slug: subject },
          },
        }),

        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { excerpt: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
          ],
        }),
      },

      orderBy: [
        { publishedAt: "desc" },
        { id: "desc" },
      ],

      take: limit + 1,

      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),

      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },

        subjects: true,

        _count: {
          select: {
            comments: {
              where: { deletedAt: null },
            },
            likes: true,
          },
        },
      },
    });

    // Fetch one extra record to determine whether more posts exist.
    const hasMore = posts.length > limit;
    const results = posts.slice(0, limit);

    const nextCursor = hasMore
      ? results[results.length - 1].id
      : null;

    return NextResponse.json({
      posts: results,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("GET /api/blogs error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
