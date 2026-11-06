"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { Comment } from "@/lib/types-client";
import CommentForm from "./ContentForm";

export default function BlogComments({
  slug,
}: {
  slug: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const result = await api<{ data: Comment[] }>(
        `/api/blogs/${slug}/comments`
      );

      setComments(result.data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load comments"
      );
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function addComment(content: string) {
    await api(`/api/blogs/${slug}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });

    await load();
  }

  return (
    <section className="mt-16 border-t pt-10">
      <h2 className="mb-7 text-xl font-bold">
        Responses ({comments.length})
      </h2>

      <CommentForm onSubmit={addComment} />

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 space-y-7">
        {comments.map((comment) => (
          <div key={comment.id} className="border-b pb-5">
            <p className="text-sm font-semibold">
              {comment.author.name || comment.author.username}
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-600">
              {comment.content}
            </p>

            <time className="mt-2 block text-xs text-neutral-400">
              {new Date(comment.createdAt).toLocaleDateString()}
            </time>
          </div>
        ))}
      </div>
    </section>
  );
}