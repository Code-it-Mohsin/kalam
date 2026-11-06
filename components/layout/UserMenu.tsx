"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import type { User } from "@/lib/types-client";

export default function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function signOut() {
    try {
      await api("/api/auth/signout", { method: "POST" });
      router.push("/blogs");
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border px-3 py-2"
      >
        {user.image ? (
          <img
            src={user.image}
            alt=""
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200">
            {user.username[0]?.toUpperCase()}
          </span>
        )}

        <span className="text-sm">{user.name || user.username}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-48 rounded-lg border bg-white p-2 shadow-lg">
          <Link href="/me" className="block rounded p-2 text-sm hover:bg-neutral-100">
            My profile
          </Link>

          <Link href="/me/dashboard" className="block rounded p-2 text-sm hover:bg-neutral-100">
            Dashboard
          </Link>

          <Link href="/me/tweaks" className="block rounded p-2 text-sm hover:bg-neutral-100">
            Settings
          </Link>

          <button
            onClick={signOut}
            className="w-full rounded p-2 text-left text-sm text-red-600 hover:bg-neutral-100"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}