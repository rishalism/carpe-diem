import { create } from "zustand";
import type { AppConfig } from "../types";
import { api } from "../services/api";

interface ConfigState extends AppConfig {
  loaded: boolean;
  fetch: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  ai_enabled: false,
  supabase_enabled: false,
  google_enabled: false,
  google_client_id: "",
  max_file_size_mb: 10,
  loaded: false,

  fetch: async () => {
    try {
      const { data } = await api.get<AppConfig>("/config");
      set({ ...data, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
}));
