interface Props {
  published: number;
  drafts: number;
  views: number;
  likes: number;
}

export default function DashboardStats({
  published,
  drafts,
  views,
  likes,
}: Props) {
  const stats = [
    ["Published posts", published],
    ["Drafts", drafts],
    ["Total views", views],
    ["Total likes", likes],
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map(([label, value]) => (
        <div key={label} className="rounded-xl border p-5">
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="mt-3 text-3xl font-bold">{value}</p>
        </div>
      ))}
    </div>
  );
}