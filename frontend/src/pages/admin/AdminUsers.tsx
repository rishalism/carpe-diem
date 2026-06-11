import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type {
  AccountStatus,
  AdminUserListItem,
  Paginated,
  UserRole,
} from "../../types";
import { adminService } from "../../services/adminService";
import { apiErrorMessage } from "../../services/api";
import { Card } from "../../components/Common/Card";
import { Button } from "../../components/Common/Button";
import { Input } from "../../components/Common/Input";
import { Spinner } from "../../components/Common/Spinner";
import { SkeletonTable } from "../../components/Common/Skeleton";
import { RoleBadge, StatusBadge } from "../../components/Admin/Badge";

const STATUSES: AccountStatus[] = [
  "active",
  "inactive",
  "suspended",
  "banned",
  "deleted",
];
const ROLES: UserRole[] = ["user", "moderator", "admin", "super_admin"];

export function AdminUsers() {
  const [data, setData] = useState<Paginated<AdminUserListItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AccountStatus | "">("");
  const [role, setRole] = useState<UserRole | "">("");
  const [q, setQ] = useState("");
  const [submittedQ, setSubmittedQ] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    adminService
      .listUsers({
        page,
        status: status || undefined,
        role: role || undefined,
        q: submittedQ || undefined,
      })
      .then(setData)
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [page, status, role, submittedQ]);

  useEffect(() => {
    load();
  }, [load]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setSubmittedQ(q.trim());
  }

  const selectCls =
    "input-base h-[42px] py-0 sm:w-44";

  return (
    <div className="animate-fade-in space-y-5">
      <h1 className="font-serif text-2xl font-semibold sm:text-3xl">Users</h1>

      <div className="flex flex-wrap items-end gap-3">
        <form onSubmit={onSearch} className="flex flex-1 items-end gap-2">
          <div className="flex-1">
            <Input
              label="Search"
              placeholder="Username, email, or user ID"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <select
          aria-label="Status"
          className={selectCls}
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as AccountStatus | "");
          }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          aria-label="Role"
          className={selectCls}
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value as UserRole | "");
          }}
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.replace("_", " ")}
            </option>
          ))}
        </select>
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
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Spaces</th>
                <th className="px-4 py-3 text-right font-medium">Entries</th>
                <th className="px-4 py-3 text-right font-medium">Reports</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {data?.items.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                  <td className="px-4 py-3">
                    <Link to={`/admin/users/${u.id}`} className="block">
                      <span className="font-medium text-brand-700 dark:text-brand-300">
                        {u.username}
                      </span>
                      <span className="block text-xs text-stone-400">{u.email}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.account_status} />
                  </td>
                  <td className="px-4 py-3 text-right">{u.total_spaces}</td>
                  <td className="px-4 py-3 text-right">{u.total_entries}</td>
                  <td className="px-4 py-3 text-right">
                    {u.total_reports_against > 0 ? (
                      <span className="text-red-600 dark:text-red-400">
                        {u.total_reports_against}
                      </span>
                    ) : (
                      0
                    )}
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
          <p className="py-10 text-center text-sm text-stone-400">No users match.</p>
        )}
      </Card>
      )}

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-400">
            Page {data.page} of {data.pages} · {data.total} users
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
