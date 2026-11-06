interface Props {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  title,
  description,
  action,
}: Props) {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center text-center">
      <h3 className="text-lg font-semibold">{title}</h3>

      {description && (
        <p className="mt-2 max-w-sm text-sm text-neutral-500">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}