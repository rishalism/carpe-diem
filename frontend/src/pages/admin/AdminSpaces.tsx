import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { AdminSpaceListItem, Paginated, SpaceType } from "../../types";
import { adminService } from "../../services/adminService";
import { apiErrorMessage } from "../../services/api";
import { SPACE_TYPES, SPACE_TYPE_MAP } from "../../utils/constants";
import { Card } from "../../components/Common/Card";
import { Button } from "../../components/Common/Button";
import { Input } from "../../components/Common/Input";
import { Spinner } from "../../components/Common/Spinner";
import { Badge } from "../../components/Admin/Badge";

export function AdminSpaces() {
  const [data, setData] = useState<Paginated<AdminSpaceListItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [type, setType] = useState<SpaceType | "">("");
  const [archived, setArchived] = useState<"" | "true" | "false">("");
  const [q, setQ] = useState("");
  const [submittedQ, setSubmittedQ] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    adminService
      .listSpaces({
        page,
        type: type || undefined,
        archived: archived === "" ? undefined : archived === "true",
        q: submittedQ || undefined,
      })
      .then(setData)
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [page, type, archived, submittedQ]);

  useEffect(() => {
    load();
  }, [load]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setSubmittedQ(q.trim());
  }

  const selectCls = "input-base h-[42px] py-0 sm:w-44";

  return (
    <div className="animate-fade-in space-y-5">
      <h1 className="font-serif text-2xl font-semibold sm:text-3xl">Spaces</h1>

      <div className="flex flex-wrap items-end gap-3">
        <form onSubmit={onSearch} className="flex flex-1 items-end gap-2">
          <div className="flex-1">
            <Input
              label="Search"
              placeholder="Space name or ID"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <select
          aria-label="Type"
          className={selectCls}
          value={type}
          onChange={(e) => {
            setPage(1);
            setType(e.target.value as SpaceType | "");
          }}
        >
          <option value="">All types</option>
          {SPACE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Archived"
          className={selectCls}
          value={archived}
          onChange={(e) => {
            setPage(1);
            setArchived(e.target.value as "" | "true" | "false");
          }}
        >
          <option value="">All</option>
          <option value="false">Active</option>
          <option value="true">Archived</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400 dark:border-stone-800">
              <tr>
                <th className="px-4 py-3 font-medium">Space</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 text-right font-medium">Members</th>
                <th className="px-4 py-3 text-right font-medium">Entries</th>
                <th className="px-4 py-3 text-right font-medium">Invites</th>
                <th className="px-4 py-3 font-medium">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {data?.items.map((s) => (
                <tr key={s.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                  <td className="px-4 py-3">
                    <Link to={`/admin/spaces/${s.id}`} className="block">
                      <span className="font-medium text-brand-700 dark:text-brand-300">
                        {SPACE_TYPE_MAP[s.type]?.emoji} {s.name}
                      </span>
                      <span className="block text-xs text-stone-400 capitalize">{s.type}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/users/${s.owner_id}`} className="text-brand-600">
                      {s.owner_username ?? s.owner_id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right">{s.member_count}</td>
                  <td className="px-4 py-3 text-right">{s.entry_count}</td>
                  <td className="px-4 py-3 text-right">{s.pending_invitations}</td>
                  <td className="px-4 py-3">
                    {s.archived ? <Badge tone="amber">archived</Badge> : <Badge tone="green">active</Badge>}
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
          <p className="py-10 text-center text-sm text-stone-400">No spaces match.</p>
        )}
      </Card>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-400">
            Page {data.page} of {data.pages} · {data.total} spaces
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
