import { useEffect, useState } from "react";
import type { ReactionSummary, ReactionType } from "../../types";
import { reactionService } from "../../services/reactionService";
import { REACTIONS } from "../../utils/constants";
import { cn } from "../../utils/cn";

export function ReactionBar({ spaceId, entryId }: { spaceId: string; entryId: string }) {
  const [summary, setSummary] = useState<ReactionSummary>({
    counts: {},
    mine: [],
    total: 0,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    reactionService
      .summary(spaceId, entryId)
      .then((s) => active && setSummary(s))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [spaceId, entryId]);

  async function toggle(type: ReactionType) {
    if (busy) return;
    setBusy(true);
    try {
      const updated = await reactionService.toggle(spaceId, entryId, type);
      setSummary(updated);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {REACTIONS.map((r) => {
        const count = summary.counts[r.value] ?? 0;
        const mine = summary.mine.includes(r.value);
        return (
          <button
            key={r.value}
            onClick={() => toggle(r.value)}
            aria-pressed={mine}
            aria-label={r.label}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
              mine
                ? "border-brand-400 bg-brand-50 dark:bg-brand-900/40"
                : "border-stone-200 hover:border-stone-300 dark:border-stone-700"
            )}
          >
            <span aria-hidden="true">{r.emoji}</span>
            {count > 0 && <span className="text-xs text-stone-500">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
