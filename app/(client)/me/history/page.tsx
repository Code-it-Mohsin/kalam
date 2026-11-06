import Link from "next/link";
import { serverApi } from "@/lib/api-server";
import type { Blog } from "@/lib/types-client";
import EmptyState from "@/components/ui/EmptyState";

export default async function HistoryPage() {
  const result = await serverApi<{ data: Blog[] }>("/api/me/history");

  const blogs = result.data;

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Reading history</h1>

      {!blogs.length ? (
        <EmptyState
          title="Nothing here yet"
          description="Stories you read will appear here."
        />
      ) : (
        <div className="divide-y">
          {blogs.map((blog) => (
            <Link
              key={blog.id}
              href={`/blogs/${blog.slug}`}
              className="block py-5 hover:bg-neutral-50"
            >
              <h2 className="font-semibold">{blog.title}</h2>
              <p className="mt-2 text-sm text-neutral-500">
                {blog.excerpt}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}