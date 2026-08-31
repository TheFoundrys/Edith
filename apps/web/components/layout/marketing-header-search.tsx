"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function MarketingHeaderSearch({
  defaultQuery = "",
}: {
  defaultQuery?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? defaultQuery;
  const [query, setQuery] = useState(urlQuery);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    router.push(
      term ? `/courses?q=${encodeURIComponent(term)}` : "/courses",
    );
  }

  return (
    <form
      className="marketing-header-search"
      role="search"
      onSubmit={handleSubmit}
    >
      <Search
        className="marketing-header-search-icon"
        strokeWidth={1.75}
        aria-hidden
      />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search courses & programs"
        className="marketing-header-search-input"
        aria-label="Search courses and programs"
      />
    </form>
  );
}
