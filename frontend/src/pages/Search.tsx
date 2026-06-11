import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { EntrySearchResult, Mood, SearchFilters } from "../types";
import { searchService } from "../services/searchService";
import { useSpaceStore } from "../store/spaceStore";
import { MOODS, MOOD_MAP } from "../utils/constants";
import { excerpt, relativeTime } from "../utils/formatters";
import { Input } from "../components/Common/Input";
import { Button } from "../components/Common/Button";
import { EmptyState } from "../components/Common/EmptyState";
import { Spinner } from "../components/Common/Spinner";

export function Search() {
  const { spaces, loaded, fetchSpaces } = useSpaceStore();
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<EntrySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!loaded) fetchSpaces();
  }, [loaded, fetchSpaces]);

  function set<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) {
    setFilters((f) => ({ ...f, [key]: value || undefined }));
  }

  async function run(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await searchService.search(filters);
      setResults(res);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <h1 className="font-serif text-2xl font-semibold">Search</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Find entries across all your spaces.
      </p>

      <form onSubmit={run} className="mt-6 space-y-3">
        <Input
          name="q"
          placeholder="Search words, titles…"
          value={filters.q ?? ""}
          onChange={(e) => set("q", e.target.value)}
        />
        <details className="sm-disclosure space-y-3">
          <summary className="tap-target flex list-none cursor-pointer items-center text-sm font-medium text-stone-500 [&::-webkit-details-marker]:hidden dark:text-stone-400">
            Filters ▾
          </summary>
          <div className="grid gap-3 sm:grid-cols-3">
            <select
              className="input-base"
              value={filters.space_id ?? ""}
              onChange={(e) => set("space_id", e.target.value)}
              aria-label="Filter by space"
            >
              <option value="">All spaces</option>
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              className="input-base"
              value={filters.mood ?? ""}
              onChange={(e) => set("mood", (e.target.value || undefined) as Mood | undefined)}
              aria-label="Filter by mood"
            >
              <option value="">Any mood</option>
              {MOODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.emoji} {m.label}
                </option>
              ))}
            </select>
            <Input
              name="tag"
              placeholder="Tag"
              value={filters.tag ?? ""}
              onChange={(e) => set("tag", e.target.value)}
            />
          </div>
        </details>
        <div className="flex justify-end">
          <Button type="submit" loading={loading}>
            Search
          </Button>
        </div>
      </form>

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-10 text-brand-600">
            <Spinner size={28} />
          </div>
        ) : !searched ? (
          <p className="text-sm text-stone-400">Enter a query or filter to begin.</p>
        ) : results.length === 0 ? (
          <EmptyState emoji="🔍" title="No results" description="Try different words or filters." />
        ) : (
          <ul className="space-y-3">
            {results.map((r) => (
              <li key={r.id}>
                <Link
                  to={`/spaces/${r.space_id}/entries/${r.id}`}
                  className="card block p-4 transition hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-serif text-base font-semibold">{r.title}</h3>
                    {r.mood && <span aria-hidden="true">{MOOD_MAP[r.mood].emoji}</span>}
                  </div>
                  <p className="mt-1 text-xs text-stone-400">
                    {r.space_name} · {relativeTime(r.created_at)}
                  </p>
                  {r.content && (
                    <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                      {excerpt(r.content, 140)}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
