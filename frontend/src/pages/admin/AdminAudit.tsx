import { FormEvent, useCallback, useEffect, useState } from "react";
import type { AuditLog, Paginated } from "../../types";
import { adminService } from "../../services/adminService";
import { apiErrorMessage } from "../../services/api";
import { Card } from "../../components/Common/Card";
import { Button } from "../../components/Common/Button";
import { Input } from "../../components/Common/Input";
import { Spinner } from "../../components/Common/Spinner";

const RESOURCE_TYPES = ["", "user", "report", "entry", "comment"];

export function AdminAudit() {
  const [data, setData] = useState<Paginated<AuditLog> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [submittedAction, setSubmittedAction] = useState("");
  const [resourceType, setResourceType] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    adminService
      .listAudit({
        page,
        action: submittedAction || undefined,
        resource_type: resourceType || undefined,
      })
      .then(setData)
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [page, submittedAction, resourceType]);

  useEffect(() => {
    load();
  }, [load]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setSubmittedAction(action.trim());
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold sm:text-3xl">Audit log</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Append-only record of every admin action.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <form onSubmit={onSearch} className="flex flex-1 items-end gap-2">
          <div className="flex-1">
            <Input
              label="Action"
              placeholder="e.g. user.suspend"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>
        <select
          aria-label="Resource type"
          className="input-base h-[42px] py-0 sm:w-44"
          value={resourceType}
          onChange={(e) => {
            setPage(1);
            setResourceType(e.target.value);
          }}
        >
          {RESOURCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "" ? "All resources" : t}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400 dark:border-stone-800">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {data?.items.map((l) => (
                <tr key={l.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-stone-400">
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{l.admin_name}</span>
                    <span className="block text-xs text-stone-400">{l.admin_role}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{l.action}</td>
                  <td className="px-4 py-3 text-xs text-stone-500">
                    {l.resource_type}
                    {l.resource_id && (
                      <span className="block text-stone-400">
                        {l.resource_id.slice(0, 8)}…
                      </span>
                    )}
                  </td>
                  <td className="max-w-[16rem] px-4 py-3 text-xs text-stone-500">
                    {l.reason || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-400">{l.ip_address}</td>
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
          <p className="py-10 text-center text-sm text-stone-400">No matching entries.</p>
        )}
      </Card>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-400">
            Page {data.page} of {data.pages} · {data.total} entries
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
