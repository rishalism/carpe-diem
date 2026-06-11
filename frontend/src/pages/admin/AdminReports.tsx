import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type {
  Paginated,
  ReportListItem,
  ReportSeverity,
  ReportStatus,
} from "../../types";
import { adminService } from "../../services/adminService";
import { apiErrorMessage } from "../../services/api";
import { Card } from "../../components/Common/Card";
import { Button } from "../../components/Common/Button";
import { Spinner } from "../../components/Common/Spinner";
import { SkeletonTable } from "../../components/Common/Skeleton";
import { ReportStatusBadge, SeverityBadge } from "../../components/Admin/Badge";

const STATUSES: ReportStatus[] = ["open", "under_review", "action_taken", "dismissed"];
const SEVERITIES: ReportSeverity[] = ["low", "medium", "high", "critical"];

export function AdminReports() {
  const [data, setData] = useState<Paginated<ReportListItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ReportStatus | "">("");
  const [severity, setSeverity] = useState<ReportSeverity | "">("");
  const [unassigned, setUnassigned] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminService
      .listReports({
        page,
        status: status || undefined,
        severity: severity || undefined,
        unassigned: unassigned || undefined,
      })
      .then(setData)
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [page, status, severity, unassigned]);

  useEffect(() => {
    load();
  }, [load]);

  const selectCls = "input-base h-[42px] py-0 sm:w-44";

  return (
    <div className="animate-fade-in space-y-5">
      <h1 className="font-serif text-2xl font-semibold sm:text-3xl">Reports</h1>

      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label="Status"
          className={selectCls}
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as ReportStatus | "");
          }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <select
          aria-label="Severity"
          className={selectCls}
          value={severity}
          onChange={(e) => {
            setPage(1);
            setSeverity(e.target.value as ReportSeverity | "");
          }}
        >
          <option value="">Any severity</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
          <input
            type="checkbox"
            checked={unassigned}
            onChange={(e) => {
              setPage(1);
              setUnassigned(e.target.checked);
            }}
          />
          Unassigned only
        </label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!data ? (
        <SkeletonTable rows={10} cols={6} />
      ) : (
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400 dark:border-stone-800">
              <tr>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {data?.items.map((r) => (
                <tr key={r.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                  <td className="px-4 py-3 capitalize">{r.content_type}</td>
                  <td className="px-4 py-3">{r.reason}</td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={r.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <ReportStatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-stone-400">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/reports/${r.id}`}
                      className="text-sm font-medium text-brand-600"
                    >
                      Review →
                    </Link>
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
        {data && data.items.length === 0 && !loading && (
          <p className="py-10 text-center text-sm text-stone-400">
            No reports in this view. 🎉
          </p>
        )}
      </Card>
      )}

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-400">
            Page {data.page} of {data.pages} · {data.total} reports
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
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
