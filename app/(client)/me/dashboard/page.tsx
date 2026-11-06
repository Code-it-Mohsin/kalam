import DashboardStats from "@/components/me/DashboardStats";
import { serverApi } from "@/lib/api-server";

interface Dashboard {
  published: number;
  drafts: number;
  views: number;
  likes: number;
}

export default async function DashboardPage() {
  const result = await serverApi<{ data: Dashboard }>(
    "/api/author/dashboard"
  );

  const stats = result.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Manage your writing and track your progress.
        </p>
      </div>

      <DashboardStats
        published={stats.published}
        drafts={stats.drafts}
        views={stats.views}
        likes={stats.likes}
      />
    </div>
  );
}