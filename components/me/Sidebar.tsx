"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/me", label: "Overview" },
  { href: "/me/dashboard", label: "Dashboard" },
  { href: "/me/dashboard/posts", label: "Published posts" },
  { href: "/me/drafts", label: "Drafts" },
  { href: "/me/new", label: "Write a story" },
  { href: "/me/history", label: "Reading history" },
  { href: "/me/tweaks", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 lg:w-56">
      <nav className="flex gap-2 overflow-x-auto lg:flex-col">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/me" &&
              pathname.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2.5 text-sm ${
                active
                  ? "bg-black text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}