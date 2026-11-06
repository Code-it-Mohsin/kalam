import ProfileCard from "@/components/me/ProfileCard";
import Link from "next/link";
import { serverApi } from "@/lib/api-server";
import type { User } from "@/lib/types-client";

export default async function MyProfilePage() {
  const result = await serverApi<{ data: User }>("/api/me");

  const user = result.data;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">My profile</h1>

      <ProfileCard user={user} />

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/me/dashboard" className="rounded-xl border p-6 hover:bg-neutral-50">
          <h2 className="font-semibold">My dashboard</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Manage your published stories and drafts.
          </p>
        </Link>

        <Link href="/me/history" className="rounded-xl border p-6 hover:bg-neutral-50">
          <h2 className="font-semibold">Reading history</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Revisit stories you have read.
          </p>
        </Link>
      </div>
    </div>
  );
}