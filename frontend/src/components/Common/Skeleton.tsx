import { cn } from "../../utils/cn";

/** Base shimmer block. Compose these to mirror a page's real layout. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-stone-200/70 dark:bg-stone-700/50",
        className
      )}
      aria-hidden="true"
    />
  );
}

/** A grid of stat-card placeholders. */
export function SkeletonStats({ count = 4, cols }: { count?: number; cols?: string }) {
  return (
    <div className={cn("grid gap-3", cols ?? "grid-cols-2 sm:grid-cols-4")}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="card flex flex-col gap-2 px-4 py-4"
        >
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Stacked text lines (e.g. inside a detail card). */
export function SkeletonLines({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

/** A table placeholder with a header strip and N shimmer rows. */
export function SkeletonTable({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="card overflow-hidden p-0">
      <div className="flex gap-4 border-b border-stone-100 px-4 py-3 dark:border-stone-800">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-stone-100 dark:divide-stone-800">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={cn("h-4 flex-1", c === 0 && "max-w-[40%]")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full-width chart placeholder. */
export function SkeletonChart({ className }: { className?: string }) {
  return <Skeleton className={cn("h-32 w-full", className)} />;
}
