import { api } from "./api";
import type { EntrySearchResult, SearchFilters } from "../types";

export const searchService = {
  async search(filters: SearchFilters) {
    // Drop empty params so the backend doesn't receive blank strings.
    const params: Record<string, string> = {};
    for (const [k, v] of Object.entries(filters)) {
      if (v) params[k] = v;
    }
    const { data } = await api.get<EntrySearchResult[]>("/search", { params });
    return data;
  },
};
