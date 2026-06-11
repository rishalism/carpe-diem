import { useEffect, useState } from "react";
import type { Comment } from "../../types";
import { commentService } from "../../services/commentService";
import { useAuthStore } from "../../store/authStore";
import { apiErrorMessage } from "../../services/api";
import { relativeTime } from "../../utils/formatters";
import { Avatar } from "../Common/Avatar";
import { Button } from "../Common/Button";
import { TextArea } from "../Common/TextArea";

interface ThreadProps {
  spaceId: string;
  entryId: string;
}

export function CommentThread({ spaceId, entryId }: ThreadProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  async function refresh() {
    const list = await commentService.list(spaceId, entryId);
    setComments(list);
  }

  useEffect(() => {
    let active = true;
    commentService
      .list(spaceId, entryId)
      .then((l) => active && setComments(l))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [spaceId, entryId]);

  async function addRoot() {
    if (!draft.trim()) return;
    setPosting(true);
    try {
      await commentService.create(spaceId, entryId, draft.trim());
      setDraft("");
      await refresh();
    } finally {
      setPosting(false);
    }
  }

  const count = countComments(comments);

  return (
    <section className="mt-10">
      <h2 className="mb-4 font-serif text-lg font-semibold">
        {count} comment{count === 1 ? "" : "s"}
      </h2>

      <div className="mb-6 space-y-2">
        <TextArea
          name="new-comment"
          rows={2}
          placeholder="Add a comment…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={addRoot} loading={posting} disabled={!draft.trim()}>
            Comment
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-stone-400">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-stone-400">No comments yet. Start the conversation.</p>
      ) : (
        <ul className="space-y-5">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              spaceId={spaceId}
              entryId={entryId}
              onChanged={refresh}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function countComments(list: Comment[]): number {
  return list.reduce((sum, c) => sum + 1 + countComments(c.replies), 0);
}

interface ItemProps {
  comment: Comment;
  spaceId: string;
  entryId: string;
  onChanged: () => Promise<void>;
  depth?: number;
}

function CommentItem({ comment, spaceId, entryId, onChanged, depth = 0 }: ItemProps) {
  const userId = useAuthStore((s) => s.user?.id);
  const isOwn = comment.author.id === userId;
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [editDraft, setEditDraft] = useState(comment.content);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitReply() {
    if (!replyDraft.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await commentService.create(spaceId, entryId, replyDraft.trim(), comment.id);
      setReplyDraft("");
      setReplying(false);
      await onChanged();
    } catch (e) {
      setError(apiErrorMessage(e, "Could not reply"));
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!editDraft.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await commentService.update(spaceId, entryId, comment.id, editDraft.trim());
      setEditing(false);
      await onChanged();
    } catch (e) {
      setError(apiErrorMessage(e, "Could not save"));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await commentService.remove(spaceId, entryId, comment.id);
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className={depth > 0 ? "ml-5 border-l border-stone-100 pl-4 dark:border-stone-800" : ""}>
      <div className="flex gap-3">
        <Avatar name={comment.author.username} src={comment.author.avatar_url} size={32} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{comment.author.username}</span>
            <span className="text-xs text-stone-400">{relativeTime(comment.created_at)}</span>
          </div>

          {editing ? (
            <div className="mt-1.5 space-y-2">
              <TextArea
                name={`edit-${comment.id}`}
                rows={2}
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit} loading={busy}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-stone-700 dark:text-stone-200">
              {comment.content}
            </p>
          )}

          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

          {!editing && (
            <div className="mt-1 flex gap-3 text-xs text-stone-400">
              <button onClick={() => setReplying((v) => !v)} className="hover:text-brand-600">
                Reply
              </button>
              {isOwn && (
                <>
                  <button onClick={() => setEditing(true)} className="hover:text-brand-600">
                    Edit
                  </button>
                  <button onClick={remove} className="hover:text-red-500" disabled={busy}>
                    Delete
                  </button>
                </>
              )}
            </div>
          )}

          {replying && (
            <div className="mt-2 space-y-2">
              <TextArea
                name={`reply-${comment.id}`}
                rows={2}
                placeholder={`Reply to ${comment.author.username}…`}
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={submitReply} loading={busy} disabled={!replyDraft.trim()}>
                  Reply
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setReplying(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {comment.replies.length > 0 && (
            <ul className="mt-4 space-y-4">
              {comment.replies.map((r) => (
                <CommentItem
                  key={r.id}
                  comment={r}
                  spaceId={spaceId}
                  entryId={entryId}
                  onChanged={onChanged}
                  depth={depth + 1}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}
