import { MOODS } from "../../utils/constants";
import type { Mood } from "../../types";
import { cn } from "../../utils/cn";

interface MoodPickerProps {
  value: Mood | null;
  onChange: (mood: Mood | null) => void;
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-stone-700 dark:text-stone-300">
        How are you feeling?
      </span>
      <div className="flex flex-wrap gap-2">
        {MOODS.map((m) => {
          const active = value === m.value;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => onChange(active ? null : m.value)}
              aria-pressed={active}
              className={cn(
                "tap-target flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
                active
                  ? "border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                  : "border-stone-200 text-stone-600 hover:border-stone-300 dark:border-stone-700 dark:text-stone-300"
              )}
            >
              <span aria-hidden="true">{m.emoji}</span>
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
