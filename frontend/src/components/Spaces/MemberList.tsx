import { useEffect, useState } from "react";
import type { SpaceMember } from "../../types";
import { spaceService } from "../../services/spaceService";
import { Avatar } from "../Common/Avatar";

export function MemberList({ spaceId, refreshKey = 0 }: { spaceId: string; refreshKey?: number }) {
  const [members, setMembers] = useState<SpaceMember[]>([]);

  useEffect(() => {
    let active = true;
    spaceService
      .members(spaceId)
      .then((m) => active && setMembers(m))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [spaceId, refreshKey]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {members.map((m) => (
        <div key={m.id} className="flex items-center gap-2">
          <Avatar name={m.user.username} src={m.user.avatar_url} size={28} />
          <span className="text-sm text-stone-600 dark:text-stone-300">
            {m.user.username}
          </span>
          {m.role === "owner" && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              Owner
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
