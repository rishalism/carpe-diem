import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { AdminDashboard as Dash } from "../../types";
import { adminService } from "../../services/adminService";
import { apiErrorMessage } from "../../services/api";
import { Card } from "../../components/Common/Card";
import { SkeletonStats, SkeletonChart, Skeleton } from "../../components/Common/Skeleton";

function Kpi({
  value,
  label,
  to,
  tone,
}: {
  value: number | string;
  label: string;
  to?: string;
  tone?: "default" | "alert";
}) {
  const body = (
    <Card className="px-4 py-4">
      <p
        className={
          "font-serif text-2xl font-semibold " +
          (tone === "alert" && value
            ? "text-red-600 dark:text-red-400"
            : "text-brand-700 dark:text-brand-300")
        }
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs uppercase tracking-wide text-stone-400">{label}</p>
    </Card>
  );
  return to ? (
    <Link to={to} className="block transition hover:opacity-90">
      {body}
    </Link>
  ) : (
    body
  );
}

export function AdminDashboard() {
  const [data, setData] = useState<Dash | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminService.dashboard().then(setData).catch((e) => setError(apiErrorMessage(e)));
  }, []);

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!data)
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-40" />
        <SkeletonStats count={8} />
        <div className="space-y-3">
          <Skeleton className="h-3 w-48" />
          <SkeletonChart />
        </div>
      </div>
    );

  const maxTrend = Math.max(1, ...data.signups_trend.map((p) => p.count));

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold sm:text-3xl">Overview</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Platform health at a glance.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi value={data.total_users} label="Total users" />
        <Kpi value={data.active_users_7d} label="Active (7d)" />
        <Kpi value={data.new_signups_7d} label="New (7d)" />
        <Kpi value={data.total_spaces} label="Spaces" />
        <Kpi value={data.total_entries} label="Entries" />
        <Kpi value={data.entries_24h} label="Entries (24h)" />
        <Kpi
          value={data.open_reports}
          label="Open reports"
          to="/admin/reports"
          tone="alert"
        />
        <Kpi value={data.suspended_users} label="Suspended" tone="alert" />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Signups · last 30 days
        </h2>
        <Card className="p-4">
          <div className="flex h-32 items-end gap-1">
            {data.signups_trend.map((p) => (
              <div key={p.date} className="group relative flex-1" title={`${p.date}: ${p.count}`}>
                <div
                  className="w-full rounded-t bg-brand-400 transition group-hover:bg-brand-500"
                  style={{ height: `${(p.count / maxTrend) * 100}%`, minHeight: p.count ? 2 : 0 }}
                />
              </div>
            ))}
          </div>
          <p className="mt-2 text-right text-xs text-stone-400">
            peak {maxTrend}/day
          </p>
        </Card>
      </section>
    </div>
  );
}
