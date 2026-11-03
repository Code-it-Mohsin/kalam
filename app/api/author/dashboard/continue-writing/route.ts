import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const draft = await db.post.findFirst({
      where: {
        authorId: auth.userId,
        status: "DRAFT",
      },
      orderBy: { updatedAt: "desc" },
      include: { subjects: true },
    });

    if (!draft) {
      return NextResponse.json({ draft: null });
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error("GET /api/author/dashboard/continue-writing:", error);
    return NextResponse.json(
      { error: "Could not fetch draft" },
      { status: 500 },
    );
  }
}