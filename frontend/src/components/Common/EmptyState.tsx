import { ReactNode } from "react";

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ emoji = "🌱", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 px-6 py-14 text-center dark:border-stone-700">
      <div className="mb-3 text-4xl" aria-hidden="true">
        {emoji}
      </div>
      <h3 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-100">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-stone-500 dark:text-stone-400">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
