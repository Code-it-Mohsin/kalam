"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BlogEditor from "@/components/editor/BlogEditor";
import Loader from "@/components/ui/loader";
import { api } from "@/lib/api-client";
import type { Blog } from "@/lib/types-client";

export default function EditDraftPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [draft, setDraft] = useState<Blog | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ data: Blog }>(`/api/author/posts/${id}`)
      .then((result) => setDraft(result.data))
      .catch((error) =>
        setError(error instanceof Error ? error.message : "Unable to load draft")
      );
  }, [id]);

  async function save(data: {
    title: string;
    excerpt: string;
    content: string;
    published: boolean;
  }) {
    await api(`/api/author/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    router.push(
      data.published ? "/me/dashboard/posts" : "/me/drafts"
    );

    router.refresh();
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!draft) return <Loader />;

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Edit draft</h1>

      <BlogEditor
        initialTitle={draft.title}
        initialExcerpt={draft.excerpt || ""}
        initialContent={draft.content || ""}
        onSave={save}
      />
    </div>
  );
}