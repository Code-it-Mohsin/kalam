"use client";

import { useRouter } from "next/navigation";
import BlogEditor from "@/components/editor/BlogEditor";
import { api } from "@/lib/api-client";

export default function NewPostPage() {
  const router = useRouter();

  async function save(data: {
    title: string;
    excerpt: string;
    content: string;
    published: boolean;
  }) {
    const result = await api<{ data: { id: string } }>(
      "/api/author/posts",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    router.push(
      data.published
        ? "/me/dashboard/posts"
        : `/me/drafts/${result.data.id}`
    );

    router.refresh();
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Write a story</h1>
      <BlogEditor onSave={save} />
    </div>
  );
}