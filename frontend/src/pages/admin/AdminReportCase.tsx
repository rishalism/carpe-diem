import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { ReportCaseDetail, ReportSeverity } from "../../types";
import { adminService } from "../../services/adminService";
import { apiErrorMessage } from "../../services/api";
import { Card } from "../../components/Common/Card";
import { Button } from "../../components/Common/Button";
import { Skeleton, SkeletonLines } from "../../components/Common/Skeleton";
import {
  ReportStatusBadge,
  SeverityBadge,
} from "../../components/Admin/Badge";
import { ActionModal } from "../../components/Admin/ActionModal";

const SEVERITIES: ReportSeverity[] = ["low", "medium", "high", "critical"];

export function AdminReportCase() {
  const { reportId = "" } = useParams();
  const [c, setC] = useState<ReportCaseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<null | "dismiss" | "remove">(null);
  const [severity, setSeverity] = useState<ReportSeverity>("medium");

  const load = useCallback(() => {
    adminService
      .getReportCase(reportId)
      .then((data) => {
        setC(data);
        setSeverity(data.severity);
      })
      .catch((e) => setError(apiErrorMessage(e)));
  }, [reportId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!c)
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-28" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Card className="space-y-3 p-4">
          <Skeleton className="h-5 w-40" />
          <SkeletonLines lines={5} />
        </Card>
      </div>
    );

  const closed = c.status === "action_taken" || c.status === "dismissed";

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      load();
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Link to="/admin/reports" className="text-sm text-brand-600">
        ← Back to reports
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold">
            Report · {c.content_type}
          </h1>
          <p className="mt-1 text-sm text-stone-400">
            Reason: <span className="text-stone-600 dark:text-stone-300">{c.reason}</span>
            {c.reported_username && (
              <>
                {" "}· author{" "}
                <Link
                  to={`/admin/users/${c.reported_user_id}`}
                  className="text-brand-600"
                >
                  {c.reported_username}
                </Link>
              </>
            )}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <ReportStatusBadge status={c.status} />
            <SeverityBadge severity={c.severity} />
            <span className="text-xs text-stone-400">
              {c.reporter_id ? "user report" : "automated flag"} ·{" "}
              {new Date(c.created_at).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {c.details && (
        <Card className="p-4 text-sm">
          <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">
            Reporter notes
          </p>
          {c.details}
        </Card>
      )}

      {/* Reported content — privacy exception */}
      <section>
        <div className="mb-2 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
          <span aria-hidden="true">⚠</span>
          Reviewing reported content. This view is recorded in the audit log.
        </div>
        <Card className="space-y-2 border-amber-200 p-4 dark:border-amber-900/60">
          {c.content_exists ? (
            <>
              {c.content_title && (
                <h2 className="font-serif text-lg font-semibold">{c.content_title}</h2>
              )}
              <p className="whitespace-pre-wrap text-sm text-stone-700 dark:text-stone-200">
                {c.content_body}
              </p>
            </>
          ) : (
            <p className="text-sm italic text-stone-400">
              This content no longer exists (already removed or deleted).
            </p>
          )}
        </Card>
      </section>

      {c.resolution_note && (
        <Card className="p-4 text-sm">
          <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">
            Resolution
          </p>
          {c.resolution_note}
        </Card>
      )}

      {/* Actions */}
      {!closed ? (
        <Card className="space-y-3 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400">
            Decision
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => run(() => adminService.assignReport(c.id))}
            >
              Claim
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy || c.status === "under_review"}
              onClick={() => run(() => adminService.markUnderReview(c.id))}
            >
              Mark under review
            </Button>
            <span className="mx-1 h-5 w-px bg-stone-200 dark:bg-stone-700" />
            <select
              aria-label="Severity"
              className="input-base h-[38px] w-32 py-0"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as ReportSeverity)}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy || severity === c.severity}
              onClick={() => run(() => adminService.setSeverity(c.id, severity))}
            >
              Set severity
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-3 dark:border-stone-800">
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => setModal("dismiss")}
            >
              Dismiss (no violation)
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={busy}
              onClick={() => setModal("remove")}
            >
              Remove content
            </Button>
          </div>
        </Card>
      ) : (
        <p className="text-sm text-stone-400">
          This case is closed. Content access is no longer available.
        </p>
      )}

      <ActionModal
        open={modal === "dismiss"}
        title="Dismiss report"
        description="Marks the report resolved with no action against the content."
        confirmLabel="Dismiss"
        requireReason
        minReason={3}
        reasonLabel="Resolution note"
        onConfirm={(note) => run(() => adminService.dismissReport(c.id, note))}
        onClose={() => setModal(null)}
      />
      <ActionModal
        open={modal === "remove"}
        title="Remove content"
        description="Takes down the reported entry/comment and closes the case. This cannot be undone."
        confirmLabel="Remove content"
        variant="danger"
        requireReason
        minReason={3}
        reasonLabel="Reason"
        onConfirm={(note) => run(() => adminService.removeContent(c.id, note))}
        onClose={() => setModal(null)}
      />
    </div>
  );
}
