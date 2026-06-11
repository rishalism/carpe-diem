import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { AdminSpaceDetail as Detail } from "../../types";
import { adminService } from "../../services/adminService";
import { apiErrorMessage } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { hasRole } from "../../utils/roles";
import { SPACE_TYPE_MAP } from "../../utils/constants";
import { Card } from "../../components/Common/Card";
import { Button } from "../../components/Common/Button";
import { Skeleton, SkeletonStats, SkeletonLines } from "../../components/Common/Skeleton";
import { Badge } from "../../components/Admin/Badge";
import { ActionModal } from "../../components/Admin/ActionModal";

type ModalKind = null | "delete" | { kind: "remove"; userId: string; username: string };

export function AdminSpaceDetail() {
  const { spaceId = "" } = useParams();
  const me = useAuthStore((s) => s.user);
  const [space, setSpace] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<ModalKind>(null);
  const [deleted, setDeleted] = useState(false);

  const load = useCallback(() => {
    adminService.getSpace(spaceId).then(setSpace).catch((e) => setError(apiErrorMessage(e)));
  }, [spaceId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (deleted)
    return (
      <div className="space-y-3">
        <p className="text-sm text-stone-500">Space deleted.</p>
        <Link to="/admin/spaces" className="text-sm text-brand-600">
          ← Back to spaces
        </Link>
      </div>
    );
  if (!space)
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-28" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <SkeletonStats count={3} cols="grid-cols-3" />
        <Card className="space-y-3 p-4">
          <SkeletonLines lines={4} />
        </Card>
      </div>
    );

  const canAdmin = hasRole(me?.role, "admin");

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
      <Link to="/admin/spaces" className="text-sm text-brand-600">
        ← Back to spaces
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold">
            {SPACE_TYPE_MAP[space.type]?.emoji} {space.name}
          </h1>
          <p className="mt-1 text-sm text-stone-400 capitalize">
            {space.type} · owner{" "}
            <Link to={`/admin/users/${space.owner_id}`} className="text-brand-600">
              {space.owner_username ?? space.owner_id.slice(0, 8)}
            </Link>{" "}
            · created {new Date(space.created_at).toLocaleDateString()}
          </p>
          <div className="mt-2">
            {space.archived ? <Badge tone="amber">archived</Badge> : <Badge tone="green">active</Badge>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="px-4 py-3 text-center">
          <p className="font-serif text-xl font-semibold">{space.member_count}</p>
          <p className="text-xs uppercase tracking-wide text-stone-400">Members</p>
        </Card>
        <Card className="px-4 py-3 text-center">
          <p className="font-serif text-xl font-semibold">{space.entry_count}</p>
          <p className="text-xs uppercase tracking-wide text-stone-400">Entries</p>
        </Card>
        <Card className="px-4 py-3 text-center">
          <p className="font-serif text-xl font-semibold">{space.pending_invitations}</p>
          <p className="text-xs uppercase tracking-wide text-stone-400">Pending</p>
        </Card>
      </div>

      {/* Members */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Members
        </h2>
        <Card className="divide-y divide-stone-100 p-0 dark:divide-stone-800">
          {space.members.map((m) => (
            <div key={m.user_id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <Link to={`/admin/users/${m.user_id}`} className="font-medium text-brand-600">
                  {m.username}
                </Link>
                <span className="ml-2 text-xs text-stone-400 capitalize">{m.role}</span>
              </div>
              {canAdmin && m.user_id !== space.owner_id && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setModal({ kind: "remove", userId: m.user_id, username: m.username })}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </Card>
      </section>

      {/* Invitations */}
      {space.invitations.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
            Invitations
          </h2>
          <Card className="divide-y divide-stone-100 p-0 dark:divide-stone-800">
            {space.invitations.map((inv, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span>{inv.email}</span>
                <Badge tone={inv.status === "pending" ? "amber" : "gray"}>{inv.status}</Badge>
              </div>
            ))}
          </Card>
        </section>
      )}

      {/* Actions */}
      {canAdmin && (
        <Card className="flex flex-wrap gap-2 p-4">
          {space.archived ? (
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(() => adminService.restoreSpace(space.id))}>
              Restore
            </Button>
          ) : (
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(() => adminService.archiveSpace(space.id))}>
              Archive
            </Button>
          )}
          <Button size="sm" variant="danger" disabled={busy} onClick={() => setModal("delete")}>
            Delete space
          </Button>
        </Card>
      )}

      <ActionModal
        open={modal === "delete"}
        title="Delete space"
        description="Permanently deletes the space and all its entries, members, and invitations. This cannot be undone."
        confirmLabel="Delete permanently"
        variant="danger"
        requireReason
        reasonLabel="Reason"
        confirmText={space.name}
        confirmTextLabel={`Type "${space.name}" to confirm`}
        onConfirm={async (reason) => {
          await adminService.deleteSpace(space.id, space.name, reason);
          setDeleted(true);
        }}
        onClose={() => setModal(null)}
      />
      <ActionModal
        open={typeof modal === "object" && modal?.kind === "remove"}
        title="Remove member"
        description={
          typeof modal === "object" && modal?.kind === "remove"
            ? `Remove ${modal.username} from this space.`
            : ""
        }
        confirmLabel="Remove"
        variant="danger"
        requireReason
        reasonLabel="Reason"
        onConfirm={(reason) => {
          if (typeof modal === "object" && modal?.kind === "remove") {
            const uid = modal.userId;
            return run(() => adminService.removeSpaceMember(space.id, uid, reason));
          }
          return Promise.resolve();
        }}
        onClose={() => setModal(null)}
      />
    </div>
  );
}
