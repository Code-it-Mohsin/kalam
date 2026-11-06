"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function BlogFilters({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {[
        { label: "Latest", value: "latest" },
        { label: "Popular", value: "popular" },
      ].map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={`rounded-full px-4 py-2 text-xs ${
            value === filter.value
              ? "bg-black text-white"
              : "border hover:bg-neutral-100"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}