import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "../../store/notificationStore";
import type { NotificationType } from "../../types";
import { relativeTime } from "../../utils/formatters";
import { cn } from "../../utils/cn";

const TYPE_EMOJI: Record<NotificationType, string> = {
  space_invitation: "✉️",
  invitation_accepted: "🤝",
  new_entry: "📝",
  new_comment: "💬",
  member_joined: "👋",
};

export function NotificationBell() {
  const navigate = useNavigate();
  const { items, unreadCount, fetch, markRead, markAllRead } =
    useNotificationStore();
  const [open, setOpen] = useState(false);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) fetch();
  }

  async function onItemClick(id: string, link?: string) {
    await markRead(id);
    setOpen(false);
    if (link) navigate(link);
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative rounded-lg p-2 text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
      >
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0  z-30" onClick={() => setOpen(false)} />
          <div className="card absolute  z-40 mt-2 max-h-96 w-80 overflow-y-auto p-0">
            <div className="flex  items-center justify-between border-b border-stone-100 px-4 py-3 dark:border-stone-800">
              <span className="text-sm font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="text-xs text-brand-600 hover:text-brand-700"
                >
                  Mark all read
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-stone-400">
                You’re all caught up.
              </p>
            ) : (
              <ul>
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => onItemClick(n.id, n.payload.link)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left text-sm hover:bg-stone-50 dark:hover:bg-stone-800",
                        !n.read && "bg-brand-50/50 dark:bg-brand-900/20",
                      )}
                    >
                      <span aria-hidden="true">
                        {TYPE_EMOJI[n.type] ?? "🔔"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-stone-700 dark:text-stone-200">
                          {n.payload.message ?? "Notification"}
                        </span>
                        <span className="text-xs text-stone-400">
                          {relativeTime(n.created_at)}
                        </span>
                      </span>
                      {!n.read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
