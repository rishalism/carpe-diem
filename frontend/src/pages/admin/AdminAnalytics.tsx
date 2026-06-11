import { useEffect, useState } from "react";
import type { AnalyticsSummary } from "../../types";
import { adminService } from "../../services/adminService";
import { apiErrorMessage } from "../../services/api";
import { Card } from "../../components/Common/Card";
import { Skeleton, SkeletonStats } from "../../components/Common/Skeleton";

const pct = (x: number) => `${Math.round(x * 100)}%`;

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <Card className="px-4 py-3">
      <p className="font-serif text-2xl font-semibold text-brand-700 dark:text-brand-300">
        {value}
      </p>
      <p className="mt-0.5 text-xs uppercase tracking-wide text-stone-400">{label}</p>
    </Card>
  );
}

export function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminService.analytics().then(setData).catch((e) => setError(apiErrorMessage(e)));
  }, []);

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!data)
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-40" />
        <SkeletonStats count={3} cols="grid-cols-3" />
        <SkeletonStats count={4} />
        <SkeletonStats count={5} cols="grid-cols-1 gap-2" />
      </div>
    );

  const maxTrend = Math.max(1, ...data.growth_trend.map((p) => p.count));
  const reg = data.funnel[0]?.count || 1;

  return (
    <div className="animate-fade-in space-y-8">
      <h1 className="font-serif text-2xl font-semibold sm:text-3xl">Analytics</h1>

      {/* Retention */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Rolling retention
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Metric value={pct(data.retention_d1)} label="Day 1" />
          <Metric value={pct(data.retention_d7)} label="Day 7" />
          <Metric value={pct(data.retention_d30)} label="Day 30" />
        </div>
        <p className="mt-2 text-xs text-stone-400">{data.retention_basis}</p>
      </section>

      {/* Engagement */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Engagement
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric value={data.engagement.dau} label="DAU" />
          <Metric value={data.engagement.wau} label="WAU" />
          <Metric value={data.engagement.mau} label="MAU" />
          <Metric value={pct(data.engagement.stickiness)} label="Stickiness" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-sm text-stone-500 dark:text-stone-400">
          <Card className="px-4 py-3">
            <span className="font-semibold text-stone-700 dark:text-stone-200">
              {data.engagement.entries_per_active}
            </span>{" "}
            entries / active
          </Card>
          <Card className="px-4 py-3">
            <span className="font-semibold text-stone-700 dark:text-stone-200">
              {data.engagement.comments_per_active}
            </span>{" "}
            comments / active
          </Card>
          <Card className="px-4 py-3">
            <span className="font-semibold text-stone-700 dark:text-stone-200">
              {data.engagement.reactions_per_active}
            </span>{" "}
            reactions / active
          </Card>
        </div>
      </section>

      {/* Funnel */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Activation funnel
        </h2>
        <Card className="space-y-3 p-4">
          {data.funnel.map((step) => (
            <div key={step.key}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{step.label}</span>
                <span className="text-stone-400">
                  {step.count} · {step.pct}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                <div
                  className="h-full rounded-full bg-brand-400"
                  style={{ width: `${(step.count / reg) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </Card>
      </section>

      {/* Growth */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Signups · last 30 days
        </h2>
        <Card className="p-4">
          <div className="flex h-28 items-end gap-1">
            {data.growth_trend.map((p) => (
              <div
                key={p.date}
                className="flex-1 rounded-t bg-brand-400"
                style={{ height: `${(p.count / maxTrend) * 100}%`, minHeight: p.count ? 2 : 0 }}
                title={`${p.date}: ${p.count}`}
              />
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-stone-400">
            <span>Total users: {data.total_users}</span>
            <span>Google: {data.signups_google}</span>
            <span>Password: {data.signups_password}</span>
          </div>
        </Card>
      </section>
    </div>
  );
}
