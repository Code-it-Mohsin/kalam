"use client";

interface Props {
  onInsert: (before: string, after?: string) => void;
}

export default function EditorToolbar({ onInsert }: Props) {
  const tools = [
    { label: "Bold", before: "**", after: "**" },
    { label: "Italic", before: "*", after: "*" },
    { label: "Heading", before: "## ", after: "" },
    { label: "Quote", before: "> ", after: "" },
    { label: "Code", before: "`", after: "`" },
  ];

  return (
    <div className="flex flex-wrap gap-2 border-b p-3">
      {tools.map((tool) => (
        <button
          type="button"
          key={tool.label}
          onClick={() => onInsert(tool.before, tool.after)}
          className="rounded border px-3 py-1.5 text-xs hover:bg-neutral-100"
        >
          {tool.label}
        </button>
      ))}
    </div>
  );
}