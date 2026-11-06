"use client";

import { useState } from "react";
import BlogSearch from "@/components/blogs/BlogSearch";
import BlogFilters from "@/components/blogs/BlogFilters";
import BlogList from "@/components/blogs/BlogList";

export default function BlogsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("latest");

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <div className="mb-12">
        <p className="text-sm font-medium text-neutral-500">
          STORIES WORTH SHARING
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          Discover ideas.
          <br />
          Discover Kalam.
        </h1>

        <p className="mt-4 text-neutral-500">
          Read, learn and share perspectives from writers around the world.
        </p>
      </div>

      <div className="mb-7 space-y-5">
        <BlogSearch value={search} onChange={setSearch} />

        <BlogFilters value={filter} onChange={setFilter} />
      </div>

      <BlogList key={filter} search={search} />
    </div>
  );
}