import Link from "next/link";
import type { User } from "@/lib/types-client";

export default function ProfileCard({ user }: { user: User }) {
  return (
    <div className="rounded-xl border p-6">
      <div className="flex items-center gap-4">
        {user.image ? (
          <img
            src={user.image}
            alt=""
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200 text-xl font-bold">
            {user.username[0]?.toUpperCase()}
          </div>
        )}

        <div>
          <h2 className="text-xl font-bold">
            {user.name || user.username}
          </h2>

          <p className="text-sm text-neutral-500">
            @{user.username}
          </p>
        </div>
      </div>

      {user.bio && (
        <p className="mt-5 text-sm leading-6 text-neutral-600">
          {user.bio}
        </p>
      )}

      <Link
        href="/me/tweaks"
        className="mt-5 inline-block text-sm underline"
      >
        Edit profile
      </Link>
    </div>
  );
}