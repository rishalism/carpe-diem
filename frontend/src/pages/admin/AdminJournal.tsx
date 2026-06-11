import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { EntryMetaItem, JournalAggregates, Paginated } from "../../types";
import { adminService } from "../../services/adminService";
import { apiErrorMessage } from "../../services/api";
import { MOOD_MAP } from "../../utils/constants";
import { Card } from "../../components/Common/Card";
import { Button } from "../../components/Common/Button";
import { Spinner } from "../../components/Common/Spinner";
import { Skeleton, SkeletonStats, SkeletonTable } from "../../components/Common/Skeleton";
import { Badge } from "../../components/Admin/Badge";

const pct = (x: number) => `${Math.round(x * 100)}%`;

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <Card className="px-4 py-3 text-center">
      <p className="font-serif text-xl font-semibold text-brand-700 dark:text-brand-300">
        {value}
      </p>
      <p className="mt-0.5 text-xs uppercase tracking-wide text-stone-400">{label}</p>
    </Card>
  );
}

const AI_TONE = {
  none: "gray",
  pending: "amber",
  done: "green",
  failed: "red",
} as const;

export function AdminJournal() {
  const [agg, setAgg] = useState<JournalAggregates | null>(null);
  const [data, setData] = useState<Paginated<EntryMetaItem> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminService.journalAggregates().then(setAgg).catch((e) => setError(apiErrorMessage(e)));
  }, []);

  useEffect(() => {
    setLoading(true);
    adminService
      .journalEntries(page)
      .then(setData)
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [page]);

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!agg)
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <SkeletonStats count={7} />
        <SkeletonTable rows={8} cols={8} />
      </div>
    );

  const moods = Object.entries(agg.mood_counts).sort((a, b) => b[1] - a[1]);
  const maxMood = moods.length ? moods[0][1] : 0;

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="font-serif text-2xl font-semibold sm:text-3xl">Journal monitoring</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric value={agg.total_entries} label="Total" />
        <Metric value={agg.entries_today} label="Today" />
        <Metric value={agg.entries_7d} label="7 days" />
        <Metric value={agg.entries_30d} label="30 days" />
        <Metric value={pct(agg.attachment_rate)} label="With photos" />
        <Metric value={pct(agg.ai_enhanced_rate)} label="AI enhanced" />
        <Metric value={agg.reported_entries} label="Reported" />
      </div>

      {moods.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
            Mood distribution
          </h2>
          <Card className="space-y-2 p-4">
            {moods.map(([mood, count]) => (
              <div key={mood} className="flex items-center gap-2 text-sm">
                <span aria-hidden="true">{MOOD_MAP[mood as keyof typeof MOOD_MAP]?.emoji}</span>
                <span className="w-16 capitalize text-stone-500">{mood}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                  <span
                    className="block h-full rounded-full bg-brand-400"
                    style={{ width: `${maxMood ? (count / maxMood) * 100 : 0}%` }}
                  />
                </span>
                <span className="w-8 text-right text-stone-400">{count}</span>
              </div>
            ))}
          </Card>
        </section>
      )}

      <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-500 dark:border-stone-700 dark:bg-stone-800/40">
        🔒 Metadata only — entry titles and content are never shown here. Reported
        entries can be reviewed under Reports.
      </div>

      {!data ? (
        <SkeletonTable rows={8} cols={8} />
      ) : (
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400 dark:border-stone-800">
              <tr>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Space</th>
                <th className="px-4 py-3 font-medium">Author</th>
                <th className="px-4 py-3 font-medium">Mood</th>
                <th className="px-4 py-3 font-medium">AI</th>
                <th className="px-4 py-3 text-right font-medium">💬</th>
                <th className="px-4 py-3 text-right font-medium">❤</th>
                <th className="px-4 py-3 font-medium">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {data?.items.map((e) => (
                <tr key={e.entry_id}>
                  <td className="whitespace-nowrap px-4 py-3 text-stone-400">
                    {new Date(e.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/spaces/${e.space_id}`} className="text-brand-600">
                      {e.space_id.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/users/${e.author_user_id}`} className="text-brand-600">
                      {e.author_user_id.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {e.mood ? MOOD_MAP[e.mood]?.emoji : "—"}
                    {e.has_attachments && <span className="ml-1" title="Has photos">📎</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={AI_TONE[e.ai_status]}>{e.ai_status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">{e.comment_count}</td>
                  <td className="px-4 py-3 text-right">{e.reaction_count}</td>
                  <td className="px-4 py-3">
                    {e.is_reported && <Badge tone="red">reported</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && (
          <div className="flex justify-center py-6 text-brand-600">
            <Spinner />
          </div>
        )}
      </Card>
      )}

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-400">
            Page {data.page} of {data.pages} · {data.total} entries
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= data.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
