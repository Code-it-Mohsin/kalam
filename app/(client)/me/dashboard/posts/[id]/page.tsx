"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BlogEditor from "@/components/editor/BlogEditor";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/loader";
import { api } from "@/lib/api-client";
import type { Blog } from "@/lib/types-client";

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [post, setPost] = useState<Blog | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ data: Blog }>(`/api/author/posts/${id}`)
      .then((result) => setPost(result.data))
      .catch((error) =>
        setError(error instanceof Error ? error.message : "Unable to load post")
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

    router.push("/me/dashboard/posts");
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this post permanently?")) return;

    await api(`/api/author/posts/${id}`, {
      method: "DELETE",
    });

    router.push("/me/dashboard/posts");
    router.refresh();
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!post) return <Loader />;

  return (
    <div>
      <div className="mb-7 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit story</h1>

        <Button variant="danger" onClick={remove}>
          Delete
        </Button>
      </div>

      <BlogEditor
        initialTitle={post.title}
        initialExcerpt={post.excerpt || ""}
        initialContent={post.content || ""}
        onSave={save}
      />
    </div>
  );
}