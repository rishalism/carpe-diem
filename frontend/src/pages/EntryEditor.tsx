import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { AIStatus, JournalEntry, Mood } from "../types";
import { entryService } from "../services/entryService";
import { useEntryStore } from "../store/entryStore";
import { useAuthStore } from "../store/authStore";
import { useConfigStore } from "../store/configStore";
import { apiErrorMessage } from "../services/api";
import { parseTags } from "../utils/validators";
import { formatDateTime } from "../utils/formatters";
import { Input } from "../components/Common/Input";
import { TextArea } from "../components/Common/TextArea";
import { Button } from "../components/Common/Button";
import { Modal } from "../components/Common/Modal";
import { MoodPicker } from "../components/Journal/MoodPicker";
import { ReactionBar } from "../components/Journal/ReactionBar";
import { AttachmentPanel } from "../components/Journal/AttachmentPanel";
import { CommentThread } from "../components/Comments/CommentThread";
import { FullPageSpinner, Spinner } from "../components/Common/Spinner";
import { cn } from "../utils/cn";

export function EntryEditor() {
  const { spaceId = "", entryId } = useParams();
  const isNew = !entryId;
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);
  const aiEnabled = useConfigStore((s) => s.ai_enabled);
  const { createEntry, updateEntry, deleteEntry } = useEntryStore();

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loadingEntry, setLoadingEntry] = useState(!isNew);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<Mood | null>(null);
  const [tagsRaw, setTagsRaw] = useState("");
  const [useAi, setUseAi] = useState(false);
  const [aiStatus, setAiStatus] = useState<AIStatus>("none");
  const [contentEnhanced, setContentEnhanced] = useState<string | null>(null);
  const [enhancedActive, setEnhancedActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const readOnly = !isNew && entry !== null && entry.author.id !== userId;

  function hydrate(e: JournalEntry) {
    setEntry(e);
    setTitle(e.title);
    setContent(e.content);
    setMood(e.mood ?? null);
    setTagsRaw(e.tags.join(", "));
    setAiStatus(e.ai_status);
    setContentEnhanced(e.content_enhanced ?? null);
    setEnhancedActive(e.enhanced_active);
  }

  useEffect(() => {
    if (isNew) return;
    let active = true;
    entryService
      .get(spaceId, entryId!)
      .then((e) => active && hydrate(e))
      .catch(
        (err) => active && setError(apiErrorMessage(err, "Entry not found")),
      )
      .finally(() => active && setLoadingEntry(false));
    return () => {
      active = false;
    };
  }, [isNew, spaceId, entryId]);

  // Poll while the AI enhancement is in progress.
  useEffect(() => {
    if (aiStatus !== "pending" || isNew || !entryId) return;
    const id = window.setInterval(async () => {
      try {
        const e = await entryService.get(spaceId, entryId);
        setAiStatus(e.ai_status);
        setContentEnhanced(e.content_enhanced ?? null);
        if (e.ai_status === "done" && e.content_enhanced) {
          setContent(e.content_enhanced);
          setEnhancedActive(true);
        }
        if (e.ai_status !== "pending") window.clearInterval(id);
      } catch {
        window.clearInterval(id);
      }
    }, 3000);
    return () => window.clearInterval(id);
  }, [aiStatus, isNew, spaceId, entryId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please add a title");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      title: title.trim(),
      content,
      mood,
      tags: parseTags(tagsRaw),
      use_ai: useAi && aiEnabled,
    };
    try {
      if (isNew) {
        const created = await createEntry(spaceId, payload);
        navigate(`/spaces/${spaceId}/entries/${created.id}`);
      } else {
        const updated = await updateEntry(spaceId, entryId!, payload);
        navigate(`/spaces/${spaceId}`);
        hydrate(updated);
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Could not save entry"));
    } finally {
      setSaving(false);
    }
  }

  async function setEnhanced(active: boolean) {
    if (!entryId) return;
    try {
      const updated = await updateEntry(spaceId, entryId, {
        enhanced_active: active,
      });
      setEnhancedActive(updated.enhanced_active);
      setContent(
        active && contentEnhanced ? contentEnhanced : updated.content,
      );
    } catch (err) {
      setError(apiErrorMessage(err, "Could not switch version"));
    }
  }

  async function onDelete() {
    setSaving(true);
    try {
      await deleteEntry(spaceId, entryId!);
      navigate(`/spaces/${spaceId}`);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not delete entry"));
      setSaving(false);
    }
  }

  if (loadingEntry) return <FullPageSpinner />;

  // --- Read-only view (other members' entries) ---
  if (readOnly && entry) {
    const body =
      enhancedActive && contentEnhanced ? contentEnhanced : entry.content;
    return (
      <article className="animate-fade-in">
        <Link
          to={`/spaces/${spaceId}`}
          className="text-sm text-stone-400 hover:text-brand-600"
        >
          ← Back to space
        </Link>
        <h1 className="mt-3 font-serif text-3xl font-semibold">
          {entry.title}
        </h1>
        <p className="mt-1 text-sm text-stone-400">
          {entry.author.username} · {formatDateTime(entry.created_at)}
          {enhancedActive && contentEnhanced && " · ✨ AI-polished"}
        </p>
        <div className="mt-6 whitespace-pre-wrap leading-relaxed text-stone-700 dark:text-stone-200">
          {body}
        </div>
        <div className="mt-8">
          <ReactionBar spaceId={spaceId} entryId={entry.id} />
        </div>
        <AttachmentPanel spaceId={spaceId} entryId={entry.id} />
        <CommentThread spaceId={spaceId} entryId={entry.id} />
      </article>
    );
  }

  return (
    <div className="animate-fade-in">
      <Link
        to={`/spaces/${spaceId}`}
        className="text-sm text-stone-400 hover:text-brand-600"
      >
        ← Back to space
      </Link>

      <form onSubmit={onSubmit} className="mt-4 space-y-5">
        <input
          name="title"
          placeholder="Entry title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent font-serif text-3xl font-semibold placeholder:text-stone-300 focus:outline-none dark:placeholder:text-stone-600"
          autoFocus
        />

        <TextArea
          name="content"
          rows={14}
          placeholder="Write what's on your mind…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {/* Secondary controls — collapsed by default on mobile so the title
            and body own the first viewport; always expanded on sm+. */}
        <details className="sm-disclosure space-y-5 rounded-xl border border-stone-100 p-4 dark:border-stone-800 sm:border-0 sm:p-0">
          <summary className="tap-target flex list-none cursor-pointer items-center text-sm font-medium text-stone-500 [&::-webkit-details-marker]:hidden dark:text-stone-400">
            Mood, tags &amp; AI ▾
          </summary>

          <MoodPicker value={mood} onChange={setMood} />

          <Input
            label="Tags"
            name="tags"
            placeholder="travel, family, milestones (comma separated)"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
          />

          {/* AI enhancement control */}
          {aiEnabled ? (
            <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
              <input
                type="checkbox"
                checked={useAi}
                onChange={(e) => setUseAi(e.target.checked)}
              />
              ✨ Polish with AI
              <span className="text-xs text-stone-400">
                (fixes grammar &amp; spelling — your words, tidied up)
              </span>
            </label>
          ) : (
            <p className="text-xs text-stone-400">
              ✨ AI polish is available once OpenRouter is configured.
            </p>
          )}
        </details>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Sticky save bar on mobile so the primary action is always reachable. */}
        <div className="sticky bottom-0 -mx-4 flex items-center justify-between border-t border-stone-100 bg-stone-50/90 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur dark:border-stone-800 dark:bg-stone-950/90 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:pb-0 sm:backdrop-blur-none">
          <div>
            {!isNew && (
              <Button
                type="button"
                variant="ghost"
                className="text-red-500"
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/spaces/${spaceId}`)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {isNew ? "Save entry" : "Save changes"}
            </Button>
          </div>
        </div>
      </form>

      {/* AI status / version switch (existing entries) */}
      {!isNew && (
        <div className="mt-4">
          {aiStatus === "pending" && (
            <div className="flex items-center gap-2 text-sm text-brand-600">
              <Spinner size={16} /> Polishing your writing…
            </div>
          )}
          {aiStatus === "failed" && (
            <p className="text-sm text-amber-600">
              AI polish didn’t complete. Your original entry is safe — try
              saving again.
            </p>
          )}
          {contentEnhanced && (
            <div className="flex items-center gap-3">
              <div className="inline-flex overflow-hidden rounded-xl border border-stone-200 text-sm dark:border-stone-700">
                <button
                  onClick={() => setEnhanced(false)}
                  className={cn(
                    "px-3 py-1.5",
                    !enhancedActive
                      ? "bg-brand-600 text-white"
                      : "text-stone-600 dark:text-stone-300",
                  )}
                >
                  Original
                </button>
                <button
                  onClick={() => setEnhanced(true)}
                  className={cn(
                    "px-3 py-1.5",
                    enhancedActive
                      ? "bg-brand-600 text-white"
                      : "text-stone-600 dark:text-stone-300",
                  )}
                >
                  ✨ Enhanced
                </button>
              </div>
              <span className="text-xs text-stone-400">
                {enhancedActive
                  ? "AI-polished version is shown in the editor"
                  : "Original version is shown in the editor"}
              </span>
            </div>
          )}
        </div>
      )}

      {!isNew && entry && (
        <>
          <div className="mt-8">
            <ReactionBar spaceId={spaceId} entryId={entry.id} />
          </div>
          <AttachmentPanel spaceId={spaceId} entryId={entry.id} />
          <CommentThread spaceId={spaceId} entryId={entry.id} />
        </>
      )}

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this entry?"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setConfirmDelete(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={onDelete} loading={saving}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-stone-600 dark:text-stone-300">
          This permanently deletes this entry. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
