import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Space } from "../types";
import { spaceService } from "../services/spaceService";
import { useEntryStore } from "../store/entryStore";
import { useSpaceStore } from "../store/spaceStore";
import { SPACE_TYPE_MAP } from "../utils/constants";
import { apiErrorMessage } from "../services/api";
import { Button } from "../components/Common/Button";
import { Input } from "../components/Common/Input";
import { Modal } from "../components/Common/Modal";
import { EmptyState } from "../components/Common/EmptyState";
import { FullPageSpinner } from "../components/Common/Spinner";
import { EntryCard } from "../components/Journal/EntryCard";
import { CalendarView } from "../components/Journal/CalendarView";
import { MemberList } from "../components/Spaces/MemberList";
import { InviteModal } from "../components/Spaces/InviteModal";
import { excerpt, relativeTime } from "../utils/formatters";
import { MOOD_MAP } from "../utils/constants";
import { cn } from "../utils/cn";

type View = "list" | "feed" | "calendar";

export function SpaceDetail() {
  const { spaceId = "" } = useParams();
  const navigate = useNavigate();
  const { entriesBySpace, loading, fetchEntries } = useEntryStore();
  const { updateSpace, deleteSpace } = useSpaceStore();

  const [space, setSpace] = useState<Space | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>("list");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const entries = entriesBySpace[spaceId] ?? [];
  const isOwner = space?.current_user_role === "owner";

  useEffect(() => {
    let active = true;
    spaceService
      .get(spaceId)
      .then((s) => active && setSpace(s))
      .catch(() => active && setNotFound(true));
    fetchEntries(spaceId);
    return () => {
      active = false;
    };
  }, [spaceId, fetchEntries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        e.tags.some((t) => t.includes(q))
    );
  }, [entries, search]);

  if (notFound) {
    return (
      <EmptyState
        emoji="🔍"
        title="Space not found"
        description="This space doesn’t exist or you don’t have access to it."
        action={<Link to="/"><Button variant="secondary">Back to dashboard</Button></Link>}
      />
    );
  }

  if (!space) return <FullPageSpinner />;

  const type = SPACE_TYPE_MAP[space.type];

  async function onArchiveToggle() {
    if (!space) return;
    setBusy(true);
    try {
      const updated = await updateSpace(space.id, { archived: !space.archived });
      setSpace(updated);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!space) return;
    setBusy(true);
    try {
      await deleteSpace(space.id);
      navigate("/");
    } catch (e) {
      alert(apiErrorMessage(e, "Could not delete space"));
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <Link to="/" className="text-sm text-stone-400 hover:text-brand-600">
        ← Dashboard
      </Link>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-2xl dark:bg-brand-900/40"
            aria-hidden="true"
          >
            {type.emoji}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold">{space.name}</h1>
            {space.description && (
              <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
                {space.description}
              </p>
            )}
            <p className="mt-1 text-xs text-stone-400">
              {type.label} · {space.member_count} member
              {space.member_count === 1 ? "" : "s"} · {entries.length} entr
              {entries.length === 1 ? "y" : "ies"}
              {space.archived && " · Archived"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <details className="relative">
              <summary className="list-none cursor-pointer rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-600 hover:bg-stone-800 dark:border-stone-700 dark:text-stone-300">
                Manage
              </summary>
              <div className="card absolute  z-10 mt-1 w-44 p-1 text-sm">
                <button
                  onClick={onArchiveToggle}
                  disabled={busy}
                  className="block w-full rounded-lg px-3 py-2 text-left hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  {space.archived ? "Unarchive" : "Archive"}
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  Delete space
                </button>
              </div>
            </details>
          )}
          {isOwner && (
            <Button variant="secondary" onClick={() => setInviteOpen(true)}>
              Invite
            </Button>
          )}
          <Button onClick={() => navigate(`/spaces/${space.id}/entries/new`)}>
            + New entry
          </Button>
        </div>
      </header>

      <div className="mt-5">
        <MemberList spaceId={space.id} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="max-w-sm flex-1">
          <Input
            name="search"
            placeholder="Search entries…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="inline-flex overflow-hidden rounded-xl border border-stone-200 text-sm dark:border-stone-700">
          {(["list", "feed", "calendar"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-3 py-2 capitalize",
                view === v
                  ? "bg-brand-600 text-white"
                  : "text-stone-600 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-800"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-6">
        {loading && entries.length === 0 ? (
          <FullPageSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            emoji="✍️"
            title={search ? "No matching entries" : "No entries yet"}
            description={
              search
                ? "Try a different search."
                : "Write your first entry to start filling this space with memories."
            }
            action={
              !search && (
                <Button onClick={() => navigate(`/spaces/${space.id}/entries/new`)}>
                  Write an entry
                </Button>
              )
            }
          />
        ) : view === "calendar" ? (
          <CalendarView entries={filtered} spaceId={space.id} />
        ) : view === "feed" ? (
          <div className="space-y-4">
            {filtered.map((entry) => (
              <Link
                key={entry.id}
                to={`/spaces/${space.id}/entries/${entry.id}`}
                className="card block p-5 transition hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3 text-sm text-stone-400">
                  <span>
                    {entry.author.username} · {relativeTime(entry.created_at)}
                  </span>
                  {entry.mood && <span aria-hidden="true">{MOOD_MAP[entry.mood].emoji}</span>}
                </div>
                <h3 className="mt-2 font-serif text-xl font-semibold">{entry.title}</h3>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed text-stone-600 dark:text-stone-300">
                  {excerpt(entry.content, 400)}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this space?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onDelete} loading={busy}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-stone-600 dark:text-stone-300">
          This permanently deletes <strong>{space.name}</strong> and all of its
          entries. This cannot be undone.
        </p>
      </Modal>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        spaceId={space.id}
      />
    </div>
  );
}
