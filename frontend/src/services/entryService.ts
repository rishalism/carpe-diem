import { api } from "./api";
import type {
  EntryCreatePayload,
  EntryUpdatePayload,
  JournalEntry,
  Mood,
} from "../types";

export interface EntryFilters {
  author_id?: string;
  mood?: Mood;
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export const entryService = {
  async list(spaceId: string, filters: EntryFilters = {}) {
    const { data } = await api.get<JournalEntry[]>(
      `/spaces/${spaceId}/entries`,
      { params: filters }
    );
    return data;
  },

  async get(spaceId: string, entryId: string) {
    const { data } = await api.get<JournalEntry>(
      `/spaces/${spaceId}/entries/${entryId}`
    );
    return data;
  },

  async create(spaceId: string, payload: EntryCreatePayload) {
    const { data } = await api.post<JournalEntry>(
      `/spaces/${spaceId}/entries`,
      payload
    );
    return data;
  },

  async update(spaceId: string, entryId: string, payload: EntryUpdatePayload) {
    const { data } = await api.patch<JournalEntry>(
      `/spaces/${spaceId}/entries/${entryId}`,
      payload
    );
    return data;
  },

  async remove(spaceId: string, entryId: string) {
    await api.delete(`/spaces/${spaceId}/entries/${entryId}`);
  },
};
