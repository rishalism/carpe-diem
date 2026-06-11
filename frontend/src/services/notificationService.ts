import { api } from "./api";
import type { NotificationList } from "../types";

export const notificationService = {
  async list() {
    const { data } = await api.get<NotificationList>("/notifications");
    return data;
  },

  async markRead(id: string) {
    await api.post(`/notifications/${id}/read`);
  },

  async markAllRead() {
    await api.post("/notifications/read-all");
  },
};
