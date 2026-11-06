"use client";

import { useEffect, useState } from "react";

import type { Blog, PaginatedBlogs } from "@/lib/types-client";
import { api } from "@/lib/api-client";

import EmptyState from "@/components/ui/EmptyState";
import BlogCard from "./BlogCard";

import Loader from "../ui/loader";
import Button from "../ui/button";

export default function BlogList({
  search = "",
  author = "",
}: {
  search?: string;
  author?: string;
}) {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadBlogs(reset = false) {
    try {
      reset ? setLoading(true) : setMoreLoading(true);
      setError("");

      const params = new URLSearchParams({ limit: "10" });

      if (search) params.set("search", search);
      if (author) params.set("author", author);

      if (!reset && cursor) params.set("cursor", cursor);

      const result = await api<{ data: PaginatedBlogs }>(
        `/api/blogs?${params.toString()}`
      );

      setBlogs((previous) =>
        reset ? result.data.blogs : [...previous, ...result.data.blogs]
      );

      setCursor(result.data.nextCursor);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load blogs"
      );
    } finally {
      setLoading(false);
      setMoreLoading(false);
    }
  }

  useEffect(() => {
    setBlogs([]);
    setCursor(null);
    loadBlogs(true);
    // Search and author changes reset pagination.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, author]);

  if (loading) return <Loader />;

  if (error) {
    return <p className="py-10 text-center text-sm text-red-600">{error}</p>;
  }

  if (!blogs.length) {
    return (
      <EmptyState
        title="No stories found"
        description="Try another search or check back later."
      />
    );
  }

  return (
    <div>
      <div>
        {blogs.map((blog) => (
          <BlogCard key={blog.id} blog={blog} />
        ))}
      </div>

      {cursor && (
        <div className="py-8 text-center">
          <Button
            variant="secondary"
            loading={moreLoading}
            onClick={() => loadBlogs()}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}