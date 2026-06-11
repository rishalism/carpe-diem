import { api } from "./api";
import type { DashboardSummary } from "../types";

export const dashboardService = {
  async summary() {
    const { data } = await api.get<DashboardSummary>("/dashboard");
    return data;
  },
};
