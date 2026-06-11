import { Link } from "react-router-dom";
import type { JournalEntry } from "../../types";
import { Avatar } from "../Common/Avatar";
import { MOOD_MAP } from "../../utils/constants";
import { excerpt, relativeTime } from "../../utils/formatters";

export function EntryCard({ entry }: { entry: JournalEntry }) {
  const mood = entry.mood ? MOOD_MAP[entry.mood] : null;
  const body = entry.enhanced_active && entry.content_enhanced
    ? entry.content_enhanced
    : entry.content;

  return (
    <Link
      to={`/spaces/${entry.space_id}/entries/${entry.id}`}
      className="card block p-5 transition hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
          <Avatar name={entry.author.username} src={entry.author.avatar_url} size={28} />
          <span>{entry.author.username}</span>
          <span aria-hidden="true">·</span>
          <span>{relativeTime(entry.created_at)}</span>
        </div>
        {mood && (
          <span className="text-xl" title={mood.label} aria-label={mood.label}>
            {mood.emoji}
          </span>
        )}
      </div>
      <h3 className="mt-3 font-serif text-lg font-semibold text-stone-800 dark:text-stone-100">
        {entry.title}
      </h3>
      {body && (
        <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
          {excerpt(body)}
        </p>
      )}
      {entry.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entry.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500 dark:bg-stone-800 dark:text-stone-400"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
