"use client";

import { useRef, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "../ui/button"
import EditorToolbar from "./EditorToolbar";

interface Props {
  initialTitle?: string;
  initialExcerpt?: string;
  initialContent?: string;
  onSave: (data: {
    title: string;
    excerpt: string;
    content: string;
    published: boolean;
  }) => Promise<void>;
}

export default function BlogEditor({
  initialTitle = "",
  initialExcerpt = "",
  initialContent = "",
  onSave,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insert(before: string, after = "") {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selected = content.substring(start, end);

    const updated =
      content.substring(0, start) +
      before +
      selected +
      after +
      content.substring(end);

    setContent(updated);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        end + before.length
      );
    });
  }

  async function save(published: boolean) {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await onSave({
        title: title.trim(),
        excerpt: excerpt.trim(),
        content,
        published,
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to save post"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Input
        placeholder="Title of your story"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border-0 px-0 text-3xl font-bold shadow-none focus:border-0"
      />

      <Input
        placeholder="Write a short description..."
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
      />

      <div className="overflow-hidden rounded-xl border">
        <EditorToolbar onInsert={insert} />

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tell your story..."
          className="min-h-[500px] w-full resize-y p-5 text-base leading-8 outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap justify-end gap-3">
        <Button
          variant="secondary"
          loading={loading}
          onClick={() => save(false)}
        >
          Save draft
        </Button>

        <Button loading={loading} onClick={() => save(true)}>
          Publish
        </Button>
      </div>
    </div>
  );
}