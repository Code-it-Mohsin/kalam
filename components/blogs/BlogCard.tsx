import Link from "next/link";
import type { Blog } from "@/lib/types-client";

export default function BlogCard({ blog }: { blog: Blog }) {
  return (
    <article className="group border-b border-neutral-200 py-7">
      <div className="mb-3 flex items-center gap-2 text-xs text-neutral-500">
        <Link href={`/${blog.author.username}`} className="font-medium text-neutral-800">
          {blog.author.name || blog.author.username}
        </Link>

        <span>·</span>

        <time>{new Date(blog.createdAt).toLocaleDateString()}</time>
      </div>

      <Link href={`/blogs/${blog.slug}`}>
        <h2 className="text-xl font-bold tracking-tight group-hover:text-neutral-600 md:text-2xl">
          {blog.title}
        </h2>

        {blog.excerpt && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-500">
            {blog.excerpt}
          </p>
        )}
      </Link>

      <div className="mt-4 flex gap-5 text-xs text-neutral-500">
        <span>{blog._count?.likes ?? 0} likes</span>
        <span>{blog._count?.comments ?? 0} comments</span>
      </div>
    </article>
  );
}