"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const SORT_OPTIONS = [
  { value: "", label: "Newest" },
  { value: "ratingAvg:desc", label: "Top rated" },
  { value: "price:asc", label: "Price: low to high" },
  { value: "price:desc", label: "Price: high to low" },
];

// Filters live in the URL (category/brand/q/sort), per
// ARCHITECTURE-FRONTEND.md §5 — this component only edits searchParams;
// the route's server component re-fetches on navigation.
export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/products?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          updateParam("q", query);
        }}
        className="flex-1"
      >
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products…"
          aria-label="Search products"
          className="w-full max-w-sm rounded-lg border border-(--color-border) px-4 py-2.5 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-(--color-ring)"
        />
      </form>
      <label className="flex items-center gap-2 text-sm text-(--color-muted-foreground)">
        Sort by
        <select
          value={searchParams.get("sort") ?? ""}
          onChange={(event) => updateParam("sort", event.target.value)}
          className="cursor-pointer rounded-lg border border-(--color-border) px-3 py-2 text-sm text-(--color-foreground) focus:outline-none focus:ring-2 focus:ring-(--color-ring)"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
