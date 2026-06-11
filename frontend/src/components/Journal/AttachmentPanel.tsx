import { useEffect, useRef, useState } from "react";
import type { Attachment } from "../../types";
import { attachmentService } from "../../services/attachmentService";
import { useAuthStore } from "../../store/authStore";
import { useConfigStore } from "../../store/configStore";
import { apiErrorMessage } from "../../services/api";
import { formatBytes, isImage, resolveFileUrl } from "../../utils/url";
import { Button } from "../Common/Button";

export function AttachmentPanel({ spaceId, entryId }: { spaceId: string; entryId: string }) {
  const userId = useAuthStore((s) => s.user?.id);
  const maxMb = useConfigStore((s) => s.max_file_size_mb);
  const [items, setItems] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    attachmentService
      .listForEntry(spaceId, entryId)
      .then((a) => active && setItems(a))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [spaceId, entryId]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > maxMb * 1024 * 1024) {
      setError(`File exceeds the ${maxMb} MB limit`);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const created = await attachmentService.upload(spaceId, entryId, file);
      setItems((prev) => [...prev, created]);
    } catch (err) {
      setError(apiErrorMessage(err, "Upload failed"));
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    try {
      await attachmentService.remove(spaceId, entryId, id);
      setItems((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(apiErrorMessage(err, "Could not delete"));
    }
  }

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold">Photos & files</h2>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={onPick}
        />
        <Button size="sm" variant="secondary" loading={uploading} onClick={() => inputRef.current?.click()}>
          + Add file
        </Button>
      </div>

      {error && <p className="mb-2 text-sm text-red-500">{error}</p>}

      {items.length === 0 ? (
        <p className="text-sm text-stone-400">No attachments yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((a) => {
            const url = resolveFileUrl(a.file_url);
            const own = a.uploader.id === userId;
            return (
              <div
                key={a.id}
                className="group relative overflow-hidden rounded-xl border border-stone-100 dark:border-stone-800"
              >
                <a href={url} target="_blank" rel="noreferrer" className="block">
                  {isImage(a.file_type) ? (
                    <img src={url} alt={a.file_name} className="h-28 w-full object-cover" />
                  ) : (
                    <div className="flex h-28 w-full flex-col items-center justify-center bg-stone-50 p-2 text-center dark:bg-stone-800">
                      <span className="text-2xl" aria-hidden="true">📄</span>
                      <span className="mt-1 line-clamp-2 text-xs text-stone-500">
                        {a.file_name}
                      </span>
                    </div>
                  )}
                </a>
                <div className="flex items-center justify-between px-2 py-1 text-[10px] text-stone-400">
                  <span>{formatBytes(a.file_size)}</span>
                  {own && (
                    <button
                      onClick={() => remove(a.id)}
                      className="text-stone-400 hover:text-red-500"
                      aria-label={`Delete ${a.file_name}`}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
