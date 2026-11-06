"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function BlogSearch({ value, onChange }: Props) {
  return (
    <input
      type="search"
      placeholder="Search stories..."
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black"
    />
  );
}