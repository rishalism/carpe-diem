import { useEffect, useState } from "react";
import type { AIMonitoring, StorageStats, SystemHealth } from "../../types";
import { adminService } from "../../services/adminService";
import { apiErrorMessage } from "../../services/api";
import { Card } from "../../components/Common/Card";
import { FullPageSpinner } from "../../components/Common/Spinner";
import { Badge } from "../../components/Admin/Badge";

function formatBytes(n: number): string {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
}

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

const STATUS_TONE: Record<string, "green" | "amber" | "red"> = {
  Operational: "green",
  Degraded: "amber",
  Down: "red",
};

export function AdminOperations() {
  const [ai, setAi] = useState<AIMonitoring | null>(null);
  const [storage, setStorage] = useState<StorageStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminService.systemHealth(),
      adminService.aiMonitoring(),
      adminService.storageStats(),
    ])
      .then(([h, a, s]) => {
        setHealth(h);
        setAi(a);
        setStorage(s);
      })
      .catch((e) => setError(apiErrorMessage(e)));
  }, []);

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!ai || !storage || !health) return <FullPageSpinner />;

  return (
    <div className="animate-fade-in space-y-8">
      <h1 className="font-serif text-2xl font-semibold sm:text-3xl">Operations</h1>

      {/* System health */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-400">
          System health
          <Badge tone={STATUS_TONE[health.status] ?? "gray"}>{health.status}</Badge>
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric value={health.db_ok ? "OK" : "Down"} label="Database" />
          <Metric value={health.ai_enabled ? "On" : "Off"} label="AI pipeline" />
          <Metric value={health.ai_pending} label="AI pending" />
          <Metric value={health.ai_failed_24h} label="AI failed 24h" />
        </div>
        <p className="mt-2 text-xs text-stone-400">
          Storage backend: {health.storage_backend}
          {health.ai_oldest_pending_age_seconds != null &&
            ` · oldest pending ${Math.round(health.ai_oldest_pending_age_seconds / 60)} min`}
        </p>
      </section>

      {/* AI monitoring */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
          AI monitoring
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric value={pct(ai.success_rate)} label="Success rate" />
          <Metric value={pct(ai.ai_enhanced_rate)} label="Entries enhanced" />
          <Metric value={`${ai.adoption_pct}%`} label="User adoption" />
          <Metric value={ai.requests_24h} label="Requests 24h" />
        </div>
        <Card className="mt-3 p-4">
          <div className="flex flex-wrap gap-3 text-sm">
            {Object.entries(ai.by_status).map(([status, n]) => (
              <span key={status} className="text-stone-500">
                <span className="font-semibold text-stone-700 dark:text-stone-200">{n}</span>{" "}
                {status}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-stone-400">{ai.note}</p>
        </Card>
      </section>

      {/* Storage */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Storage ({storage.backend})
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric value={formatBytes(storage.total_bytes)} label="Total used" />
          <Metric value={storage.total_attachments} label="Attachments" />
          <Metric value={formatBytes(storage.avg_bytes)} label="Avg size" />
        </div>
        {storage.largest.length > 0 && (
          <Card className="mt-3 overflow-hidden p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400 dark:border-stone-800">
                <tr>
                  <th className="px-4 py-2.5 font-medium">File</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 text-right font-medium">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {storage.largest.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-2.5">{o.file_name}</td>
                    <td className="px-4 py-2.5 text-stone-400">{o.file_type ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right">{formatBytes(o.file_size ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </div>
  );
}
