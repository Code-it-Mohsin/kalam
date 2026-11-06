import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-8 text-sm text-neutral-500 md:flex-row">
        <p>© {new Date().getFullYear()} Kalam. All rights reserved.</p>

        <div className="flex gap-5">
          <Link href="/blogs">Explore</Link>
          <Link href="/auth/signup">Join Kalam</Link>
        </div>
      </div>
    </footer>
  );
}