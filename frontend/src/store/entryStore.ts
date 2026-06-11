import { create } from "zustand";
import type { EntryCreatePayload, EntryUpdatePayload, JournalEntry } from "../types";
import { entryService, type EntryFilters } from "../services/entryService";

interface EntryState {
  entriesBySpace: Record<string, JournalEntry[]>;
  loading: boolean;
  fetchEntries: (spaceId: string, filters?: EntryFilters) => Promise<void>;
  createEntry: (spaceId: string, payload: EntryCreatePayload) => Promise<JournalEntry>;
  updateEntry: (
    spaceId: string,
    entryId: string,
    payload: EntryUpdatePayload
  ) => Promise<JournalEntry>;
  deleteEntry: (spaceId: string, entryId: string) => Promise<void>;
}

export const useEntryStore = create<EntryState>((set) => ({
  entriesBySpace: {},
  loading: false,

  fetchEntries: async (spaceId, filters) => {
    set({ loading: true });
    try {
      const entries = await entryService.list(spaceId, filters);
      set((s) => ({
        entriesBySpace: { ...s.entriesBySpace, [spaceId]: entries },
      }));
    } finally {
      set({ loading: false });
    }
  },

  createEntry: async (spaceId, payload) => {
    const entry = await entryService.create(spaceId, payload);
    set((s) => ({
      entriesBySpace: {
        ...s.entriesBySpace,
        [spaceId]: [entry, ...(s.entriesBySpace[spaceId] ?? [])],
      },
    }));
    return entry;
  },

  updateEntry: async (spaceId, entryId, payload) => {
    const updated = await entryService.update(spaceId, entryId, payload);
    set((s) => ({
      entriesBySpace: {
        ...s.entriesBySpace,
        [spaceId]: (s.entriesBySpace[spaceId] ?? []).map((e) =>
          e.id === entryId ? updated : e
        ),
      },
    }));
    return updated;
  },

  deleteEntry: async (spaceId, entryId) => {
    await entryService.remove(spaceId, entryId);
    set((s) => ({
      entriesBySpace: {
        ...s.entriesBySpace,
        [spaceId]: (s.entriesBySpace[spaceId] ?? []).filter(
          (e) => e.id !== entryId
        ),
      },
    }));
  },
}));
