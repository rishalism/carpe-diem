import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { JournalEntry } from "../../types";
import { MOOD_MAP } from "../../utils/constants";
import { cn } from "../../utils/cn";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({
  entries,
  spaceId,
}: {
  entries: JournalEntry[];
  spaceId: string;
}) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const byDay = useMemo(() => {
    const map: Record<string, JournalEntry[]> = {};
    for (const e of entries) {
      const d = new Date(e.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      (map[key] ??= []).push(e);
    }
    return map;
  }, [entries]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="rounded-lg px-2 py-1 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
          aria-label="Previous month"
        >
          ←
        </button>
        <h3 className="font-serif text-lg font-semibold">
          {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h3>
        <button
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="rounded-lg px-2 py-1 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-stone-400">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const key = `${year}-${month}-${day}`;
          const dayEntries = byDay[key] ?? [];
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;
          return (
            <div
              key={key}
              className={cn(
                "min-h-[64px] rounded-lg border border-stone-100 p-1 text-left dark:border-stone-800",
                isToday && "border-brand-300 bg-brand-50/50 dark:bg-brand-900/20"
              )}
            >
              <div className="text-xs text-stone-400">{day}</div>
              <div className="mt-0.5 space-y-0.5">
                {dayEntries.slice(0, 2).map((e) => (
                  <Link
                    key={e.id}
                    to={`/spaces/${spaceId}/entries/${e.id}`}
                    title={e.title}
                    className="block truncate rounded bg-brand-100 px-1 text-[10px] text-brand-700 hover:bg-brand-200 dark:bg-brand-900/40 dark:text-brand-200"
                  >
                    {e.mood ? `${MOOD_MAP[e.mood].emoji} ` : ""}
                    {e.title}
                  </Link>
                ))}
                {dayEntries.length > 2 && (
                  <span className="text-[10px] text-stone-400">
                    +{dayEntries.length - 2} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
