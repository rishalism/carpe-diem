import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { AdminUserDetail as Detail, UserJourney, UserRole } from "../../types";
import { adminService } from "../../services/adminService";
import { apiErrorMessage } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { hasRole } from "../../utils/roles";
import { Card } from "../../components/Common/Card";
import { Button } from "../../components/Common/Button";
import { FullPageSpinner } from "../../components/Common/Spinner";
import { RoleBadge, StatusBadge } from "../../components/Admin/Badge";
import { ActionModal } from "../../components/Admin/ActionModal";

type ModalKind = null | "suspend" | "ban" | "reactivate" | "reset" | "delete" | "role";

const ROLES: UserRole[] = ["user", "moderator", "admin", "super_admin"];

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-stone-50 px-3 py-2 text-center dark:bg-stone-800/50">
      <p className="font-serif text-lg font-semibold">{value}</p>
      <p className="text-xs uppercase tracking-wide text-stone-400">{label}</p>
    </div>
  );
}

export function AdminUserDetail() {
  const { userId = "" } = useParams();
  const me = useAuthStore((s) => s.user);
  const [user, setUser] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [roleChoice, setRoleChoice] = useState<UserRole>("user");
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [journey, setJourney] = useState<UserJourney | null>(null);

  const load = useCallback(() => {
    adminService
      .getUser(userId)
      .then((u) => {
        setUser(u);
        setRoleChoice(u.role);
      })
      .catch((e) => setError(apiErrorMessage(e)));
  }, [userId]);

  useEffect(() => {
    load();
    adminService.userJourney(userId).then(setJourney).catch(() => {});
  }, [load, userId]);

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (deleted)
    return (
      <div className="space-y-3">
        <p className="text-sm text-stone-500">User soft-deleted.</p>
        <Link to="/admin/users" className="text-sm text-brand-600">
          ← Back to users
        </Link>
      </div>
    );
  if (!user) return <FullPageSpinner />;

  const canAdmin = hasRole(me?.role, "admin");
  const canSuper = hasRole(me?.role, "super_admin");
  const isSelf = me?.id === user.id;
  const isActive = user.account_status === "active";
  const isBlocked =
    user.account_status === "suspended" || user.account_status === "banned";

  async function refreshAfter(fn: () => Promise<unknown>) {
    await fn();
    load();
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Link to="/admin/users" className="text-sm text-brand-600">
        ← Back to users
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold">{user.username}</h1>
          <p className="text-sm text-stone-400">{user.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RoleBadge role={user.role} />
            <StatusBadge status={user.account_status} />
            <span className="text-xs text-stone-400">
              via {user.auth_method} · joined{" "}
              {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {user.suspension_reason && (
        <Card className="border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
          <strong>Reason on file:</strong> {user.suspension_reason}
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Spaces" value={user.total_spaces} />
        <Stat label="Entries" value={user.total_entries} />
        <Stat label="Comments" value={user.total_comments} />
        <Stat label="Reactions" value={user.total_reactions} />
        <Stat label="Reports" value={user.total_reports_against} />
      </div>

      {/* Journey */}
      {journey && (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400">
              Journey
            </h2>
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
              {journey.stage}
            </span>
          </div>
          <ol className="space-y-2">
            {journey.events.map((ev) => (
              <li key={ev.type} className="flex items-center gap-3 text-sm">
                <span
                  className={
                    "h-2 w-2 shrink-0 rounded-full " +
                    (ev.at ? "bg-brand-400" : "bg-stone-200 dark:bg-stone-700")
                  }
                />
                <span className="flex-1 text-stone-600 dark:text-stone-300">{ev.label}</span>
                <span className="text-xs text-stone-400">
                  {ev.at ? new Date(ev.at).toLocaleDateString() : "—"}
                </span>
              </li>
            ))}
          </ol>
          <div className="flex gap-2 border-t border-stone-100 pt-3 text-xs dark:border-stone-800">
            {(["d1", "d7", "d30"] as const).map((k) => {
              const ret = k === "d1" ? journey.retained_d1 : k === "d7" ? journey.retained_d7 : journey.retained_d30;
              return (
                <span
                  key={k}
                  className={
                    "rounded-full px-2 py-0.5 " +
                    (ret
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                      : "bg-stone-100 text-stone-400 dark:bg-stone-800")
                  }
                >
                  {k.toUpperCase()} {ret ? "✓" : "✗"}
                </span>
              );
            })}
          </div>
        </Card>
      )}

      {/* Actions */}
      {canAdmin && !isSelf && (
        <Card className="space-y-3 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400">
            Actions
          </h2>
          <div className="flex flex-wrap gap-2">
            {isActive && (
              <Button size="sm" variant="secondary" onClick={() => setModal("suspend")}>
                Suspend
              </Button>
            )}
            {isBlocked && (
              <Button size="sm" variant="secondary" onClick={() => setModal("reactivate")}>
                Reactivate
              </Button>
            )}
            {user.account_status !== "banned" && (
              <Button size="sm" variant="danger" onClick={() => setModal("ban")}>
                Ban
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => setModal("reset")}>
              Reset password
            </Button>
            {canSuper && (
              <Button size="sm" variant="danger" onClick={() => setModal("delete")}>
                Delete
              </Button>
            )}
          </div>

          {canSuper && (
            <div className="flex items-end gap-2 pt-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-stone-600 dark:text-stone-300">
                  Role
                </span>
                <select
                  className="input-base h-[42px] py-0"
                  value={roleChoice}
                  onChange={(e) => setRoleChoice(e.target.value as UserRole)}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                size="sm"
                variant="secondary"
                disabled={roleChoice === user.role}
                onClick={() => setModal("role")}
              >
                Change role
              </Button>
            </div>
          )}
        </Card>
      )}

      {resetLink && (
        <Card className="space-y-1 p-4 text-sm">
          <p className="font-medium text-stone-700 dark:text-stone-200">
            Password reset link (deliver to the user; not shown again):
          </p>
          <code className="block break-all rounded-lg bg-stone-100 p-2 text-xs dark:bg-stone-800">
            {resetLink}
          </code>
        </Card>
      )}

      {/* Modals */}
      <ActionModal
        open={modal === "suspend"}
        title="Suspend user"
        description="The user will be unable to log in until reactivated."
        confirmLabel="Suspend"
        requireReason
        reasonLabel="Reason for suspension"
        onConfirm={(reason) => refreshAfter(() => adminService.suspend(user.id, reason))}
        onClose={() => setModal(null)}
      />
      <ActionModal
        open={modal === "ban"}
        title="Ban user"
        description="Permanent access removal. Only a super admin can reverse a ban."
        confirmLabel="Ban"
        variant="danger"
        requireReason
        reasonLabel="Reason for ban"
        onConfirm={(reason) => refreshAfter(() => adminService.ban(user.id, reason))}
        onClose={() => setModal(null)}
      />
      <ActionModal
        open={modal === "reactivate"}
        title="Reactivate user"
        description="Restores login access."
        confirmLabel="Reactivate"
        onConfirm={() => refreshAfter(() => adminService.reactivate(user.id))}
        onClose={() => setModal(null)}
      />
      <ActionModal
        open={modal === "reset"}
        title="Reset password"
        description="Generates a reset link. It is delivered by email when configured."
        confirmLabel="Generate link"
        onConfirm={async () => {
          const res = await adminService.resetPassword(user.id);
          setResetLink(res.temporary_link ?? null);
        }}
        onClose={() => setModal(null)}
      />
      <ActionModal
        open={modal === "role"}
        title="Change role"
        description={`Change ${user.username}'s role from ${user.role.replace(
          "_",
          " "
        )} to ${roleChoice.replace("_", " ")}.`}
        confirmLabel="Change role"
        onConfirm={() => refreshAfter(() => adminService.setRole(user.id, roleChoice))}
        onClose={() => setModal(null)}
      />
      <ActionModal
        open={modal === "delete"}
        title="Delete user"
        description="Soft delete. The account is disabled and PII minimized; the audit trail is retained."
        confirmLabel="Delete permanently"
        variant="danger"
        requireReason
        reasonLabel="Reason"
        confirmText={user.username}
        confirmTextLabel={`Type "${user.username}" to confirm`}
        onConfirm={async (reason) => {
          await adminService.deleteUser(user.id, user.username, reason);
          setDeleted(true);
        }}
        onClose={() => setModal(null)}
      />
    </div>
  );
}
