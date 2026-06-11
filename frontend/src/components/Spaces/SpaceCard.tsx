import { Link } from "react-router-dom";
import type { Space } from "../../types";
import { SPACE_TYPE_MAP } from "../../utils/constants";

export function SpaceCard({ space }: { space: Space }) {
  const type = SPACE_TYPE_MAP[space.type];
  return (
    <Link
      to={`/spaces/${space.id}`}
      className="card group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-2xl dark:bg-brand-900/40"
          aria-hidden="true"
        >
          {type.emoji}
        </div>
        {space.current_user_role === "owner" && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            Owner
          </span>
        )}
      </div>
      <div>
        <h3 className="font-serif text-lg font-semibold text-stone-800 group-hover:text-brand-700 dark:text-stone-100">
          {space.name}
        </h3>
        {space.description && (
          <p className="mt-1 line-clamp-2 text-sm text-stone-500 dark:text-stone-400">
            {space.description}
          </p>
        )}
      </div>
      <div className="mt-auto flex items-center gap-4 text-xs text-stone-400">
        <span>{type.label}</span>
        <span>· {space.member_count} member{space.member_count === 1 ? "" : "s"}</span>
        <span>· {space.entry_count} entr{space.entry_count === 1 ? "y" : "ies"}</span>
      </div>
    </Link>
  );
}
