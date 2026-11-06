import Link from "next/link";
import { serverApi } from "@/lib/api-server";
import type { Blog } from "@/lib/types-client";
import EmptyState from "@/components/ui/EmptyState";

export default async function AuthorPostsPage() {
  const result = await serverApi<{ data: Blog[] }>(
    "/api/author/dashboard/posts"
  );

  const posts = result.data;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Published posts</h1>

        <Link
          href="/me/new"
          className="rounded-lg bg-black px-4 py-2.5 text-sm text-white"
        >
          New story
        </Link>
      </div>

      {posts.length === 0 ? (
        <EmptyState title="No published stories yet" />
      ) : (
        <div className="divide-y">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/me/dashboard/posts/${post.id}`}
              className="block py-5 hover:bg-neutral-50"
            >
              <h2 className="font-semibold">{post.title}</h2>

              <p className="mt-2 text-sm text-neutral-500">
                {post.excerpt}
              </p>

              <p className="mt-3 text-xs text-neutral-400">
                {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}