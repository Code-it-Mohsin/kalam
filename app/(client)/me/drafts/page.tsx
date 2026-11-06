import Link from "next/link";
import { serverApi } from "@/lib/api-server";
import type { Blog } from "@/lib/types-client";
import EmptyState from "@/components/ui/EmptyState";

export default async function DraftsPage() {
  const result = await serverApi<{ data: Blog[] }>(
    "/api/author/dashboard/drafts"
  );

  const drafts = result.data;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your drafts</h1>

        <Link href="/me/new" className="rounded-lg bg-black px-4 py-2 text-sm text-white">
          Write
        </Link>
      </div>

      {!drafts.length ? (
        <EmptyState title="No drafts yet" description="Your unpublished stories will appear here." />
      ) : (
        <div className="divide-y">
          {drafts.map((draft) => (
            <Link
              key={draft.id}
              href={`/me/drafts/${draft.id}`}
              className="block py-5 hover:bg-neutral-50"
            >
              <h2 className="font-semibold">{draft.title}</h2>
              <p className="mt-2 text-sm text-neutral-500">
                {draft.excerpt}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}