"use client";

import { useState } from "react";
import Button from "../ui/button";

export default function CommentForm({
  onSubmit,
}: {
  onSubmit: (content: string) => Promise<void>;
}) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!content.trim()) return;

    try {
      setLoading(true);
      setError("");

      await onSubmit(content.trim());
      setContent("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to post comment"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thoughts..."
        rows={3}
        className="w-full rounded-lg border p-3 text-sm outline-none focus:border-black"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button loading={loading} onClick={submit}>
        Comment
      </Button>
    </div>
  );
}