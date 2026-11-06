export default function BlogContent({
  content,
}: {
  content: string;
}) {
  return (
    <article className="whitespace-pre-wrap break-words text-base leading-8 text-neutral-800">
      {content}
    </article>
  );
}