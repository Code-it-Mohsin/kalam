"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import UserMenu from "./UserMenu";
import { api } from "@/lib/api-client";
import type { User } from "@/lib/types-client";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api<{ data: User }>("/api/auth/me")
      .then((result) => setUser(result.data))
      .catch(() => setUser(null));
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/blogs" className="text-2xl font-bold tracking-tight">
          kalam<span className="text-neutral-400">.</span>
        </Link>

        <div className="hidden items-center gap-7 text-sm md:flex">
          <Link href="/blogs" className="hover:text-neutral-500">
            Explore
          </Link>

          {user && (
            <>
              <Link href="/me/new">Write</Link>
              <Link href="/me/dashboard">Dashboard</Link>
            </>
          )}
        </div>

        <div>
          {user ? (
            <UserMenu user={user} />
          ) : (
            <div className="flex items-center gap-4 text-sm">
              <Link href="/auth/signin">Sign in</Link>

              <Link
                href="/auth/signup"
                className="rounded-lg bg-black px-4 py-2.5 text-white"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}