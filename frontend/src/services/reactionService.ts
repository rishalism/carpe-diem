import { api } from "./api";
import type { ReactionSummary, ReactionType } from "../types";

export const reactionService = {
  async summary(spaceId: string, entryId: string) {
    const { data } = await api.get<ReactionSummary>(
      `/spaces/${spaceId}/entries/${entryId}/reactions`
    );
    return data;
  },

  async toggle(spaceId: string, entryId: string, type: ReactionType) {
    const { data } = await api.post<ReactionSummary>(
      `/spaces/${spaceId}/entries/${entryId}/reactions`,
      { type }
    );
    return data;
  },
};
