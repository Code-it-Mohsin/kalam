import Link from "next/link";
import BlogContent from "@/components/blogs/BlogContent";
import BlogComments from "@/components/blogs/BlogComments";
import { serverApi } from "@/lib/api-server";
import type { Blog } from "@/lib/types-client";
import { notFound } from "next/navigation";

export default async function BlogDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let blog: Blog;

  try {
    const result = await serverApi<{ data: Blog }>(
      `/api/blogs/${encodeURIComponent(slug)}`
    );;

    blog = result.data;
  } catch {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/blogs" className="text-sm text-neutral-500">
        ← Back to stories
      </Link>

      <h1 className="mt-10 text-4xl font-bold leading-tight md:text-5xl">
        {blog.title}
      </h1>

      {blog.excerpt && (
        <p className="mt-5 text-lg leading-8 text-neutral-500">
          {blog.excerpt}
        </p>
      )}

      <div className="my-8 flex items-center gap-3 border-y py-5">
        {blog.author.image && (
          <img
            src={blog.author.image}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
          />
        )}

        <div>
          <Link
            href={`/${blog.author.username}`}
            className="text-sm font-semibold"
          >
            {blog.author.name || blog.author.username}
          </Link>

          <p className="text-xs text-neutral-500">
            {new Date(blog.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {blog.coverImage && (
        <img
          src={blog.coverImage}
          alt=""
          className="mb-10 max-h-[450px] w-full rounded-xl object-cover"
        />
      )}

      <BlogContent content={blog.content || ""} />

      <div className="mt-12 border-t pt-6 text-sm text-neutral-500">
        {blog._count?.likes ?? 0} likes
      </div>

      <BlogComments slug={slug} />
    </article>
  );
}