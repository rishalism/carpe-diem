import { create } from "zustand";
import type { Space, SpaceCreatePayload } from "../types";
import { spaceService } from "../services/spaceService";

interface SpaceState {
  spaces: Space[];
  loading: boolean;
  loaded: boolean;
  fetchSpaces: (includeArchived?: boolean) => Promise<void>;
  createSpace: (payload: SpaceCreatePayload) => Promise<Space>;
  updateSpace: (
    spaceId: string,
    payload: Partial<SpaceCreatePayload> & { archived?: boolean }
  ) => Promise<Space>;
  deleteSpace: (spaceId: string) => Promise<void>;
}

export const useSpaceStore = create<SpaceState>((set) => ({
  spaces: [],
  loading: false,
  loaded: false,

  fetchSpaces: async (includeArchived = false) => {
    set({ loading: true });
    try {
      const spaces = await spaceService.list(includeArchived);
      set({ spaces, loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  createSpace: async (payload) => {
    const space = await spaceService.create(payload);
    set((s) => ({ spaces: [space, ...s.spaces] }));
    return space;
  },

  updateSpace: async (spaceId, payload) => {
    const updated = await spaceService.update(spaceId, payload);
    set((s) => ({
      spaces: s.spaces.map((sp) => (sp.id === spaceId ? updated : sp)),
    }));
    return updated;
  },

  deleteSpace: async (spaceId) => {
    await spaceService.remove(spaceId);
    set((s) => ({ spaces: s.spaces.filter((sp) => sp.id !== spaceId) }));
  },
}));
