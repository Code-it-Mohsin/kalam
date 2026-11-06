import Sidebar from "@/components/me/Sidebar";

export default function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 lg:flex-row">
      <Sidebar />

      <section className="min-w-0 flex-1">
        {children}
      </section>
    </div>
  );
}