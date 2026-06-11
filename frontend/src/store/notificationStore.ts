import { create } from "zustand";
import type { AppNotification } from "../types";
import { notificationService } from "../services/notificationService";

interface NotificationState {
  items: AppNotification[];
  unreadCount: number;
  loading: boolean;
  fetch: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unreadCount: 0,
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const data = await notificationService.list();
      set({ items: data.items, unreadCount: data.unread_count });
    } catch {
      // ignore transient errors (e.g. while logging out)
    } finally {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    const target = get().items.find((n) => n.id === id);
    if (!target || target.read) return;
    await notificationService.markRead(id);
    set((s) => ({
      items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
  },

  markAllRead: async () => {
    await notificationService.markAllRead();
    set((s) => ({
      items: s.items.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },
}));
