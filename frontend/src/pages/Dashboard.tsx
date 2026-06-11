import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { DashboardSummary } from "../types";
import { useAuthStore } from "../store/authStore";
import { useSpaceStore } from "../store/spaceStore";
import { dashboardService } from "../services/dashboardService";
import { MOOD_MAP } from "../utils/constants";
import { relativeTime } from "../utils/formatters";
import { SpaceCard } from "../components/Spaces/SpaceCard";
import { CreateSpaceModal } from "../components/Spaces/CreateSpaceModal";
import { Card } from "../components/Common/Card";
import { Button } from "../components/Common/Button";
import { EmptyState } from "../components/Common/EmptyState";
import { FullPageSpinner } from "../components/Common/Spinner";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <Card className="px-4 py-3 text-center">
      <p className="font-serif text-2xl font-semibold text-brand-700 dark:text-brand-300">
        {value}
      </p>
      <p className="mt-0.5 text-xs uppercase tracking-wide text-stone-400">{label}</p>
    </Card>
  );
}

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { spaces, loading, loaded, fetchSpaces } = useSpaceStore();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchSpaces();
    dashboardService.summary().then(setSummary).catch(() => {});
  }, [fetchSpaces]);

  const moodEntries = summary
    ? Object.entries(summary.mood_counts).sort((a, b) => b[1] - a[1])
    : [];
  const maxMood = moodEntries.length ? moodEntries[0][1] : 0;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold sm:text-3xl">
            {greeting()}, {user?.username}.
          </h1>
          <p className="mt-1 text-stone-500 dark:text-stone-400">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ New space</Button>
      </div>

      {/* Stats */}
      {summary && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard value={`${summary.streak_days}🔥`} label="Day streak" />
          <StatCard value={summary.entries_this_month} label="This month" />
          <StatCard value={summary.total_entries} label="Total entries" />
          <StatCard value={summary.total_spaces} label="Spaces" />
        </div>
      )}

      {/* On this day */}
      {summary && summary.on_this_day.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
            ✨ On this day
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {summary.on_this_day.map((e) => (
              <Link
                key={e.id}
                to={`/spaces/${e.space_id}/entries/${e.id}`}
                className="card block p-4 transition hover:shadow-md"
              >
                <p className="text-xs text-stone-400">
                  {new Date(e.created_at).getFullYear()} · {e.space_name}
                </p>
                <h3 className="mt-0.5 font-serif font-semibold">{e.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Recent entries */}
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
            Recent entries
          </h2>
          {summary && summary.recent_entries.length > 0 ? (
            <ul className="space-y-2">
              {summary.recent_entries.map((e) => (
                <li key={e.id}>
                  <Link
                    to={`/spaces/${e.space_id}/entries/${e.id}`}
                    className="card flex items-center justify-between gap-3 p-3 transition hover:shadow-md"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{e.title}</p>
                      <p className="text-xs text-stone-400">
                        {e.space_name} · {relativeTime(e.created_at)}
                      </p>
                    </div>
                    {e.mood && <span aria-hidden="true">{MOOD_MAP[e.mood].emoji}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-400">No entries yet.</p>
          )}
        </section>

        {/* Mood overview */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
            Mood overview
          </h2>
          <Card>
            {moodEntries.length === 0 ? (
              <p className="text-sm text-stone-400">Track moods on your entries.</p>
            ) : (
              <ul className="space-y-2">
                {moodEntries.map(([mood, count]) => (
                  <li key={mood} className="flex items-center gap-2 text-sm">
                    <span aria-hidden="true">{MOOD_MAP[mood as keyof typeof MOOD_MAP]?.emoji}</span>
                    <span className="w-16 text-stone-500">
                      {MOOD_MAP[mood as keyof typeof MOOD_MAP]?.label}
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                      <span
                        className="block h-full rounded-full bg-brand-400"
                        style={{ width: `${maxMood ? (count / maxMood) * 100 : 0}%` }}
                      />
                    </span>
                    <span className="w-5 text-right text-stone-400">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>

      {/* Spaces */}
      <section className="mt-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Your spaces
        </h2>
        {loading && !loaded ? (
          <FullPageSpinner />
        ) : spaces.length === 0 ? (
          <EmptyState
            emoji="📔"
            title="No spaces yet"
            description="Spaces are private journals you keep alone or share with people you love. Create your first one to begin."
            action={<Button onClick={() => setModalOpen(true)}>Create a space</Button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {spaces.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        )}
      </section>

      <CreateSpaceModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
