import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-5 py-10">
      <Link href="/blogs" className="mb-8 text-3xl font-bold">
        kalam.
      </Link>

      <div className="w-full max-w-md rounded-2xl border bg-white p-7 shadow-sm">
        {children}
      </div>

      <p className="mt-6 text-xs text-neutral-400">
        © {new Date().getFullYear()} Kalam
      </p>
    </main>
  );
}