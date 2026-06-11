import { api } from "./api";
import type { Comment } from "../types";

export const commentService = {
  async list(spaceId: string, entryId: string) {
    const { data } = await api.get<Comment[]>(
      `/spaces/${spaceId}/entries/${entryId}/comments`
    );
    return data;
  },

  async create(
    spaceId: string,
    entryId: string,
    content: string,
    parentId?: string | null
  ) {
    const { data } = await api.post<Comment>(
      `/spaces/${spaceId}/entries/${entryId}/comments`,
      { content, parent_id: parentId ?? null }
    );
    return data;
  },

  async update(spaceId: string, entryId: string, commentId: string, content: string) {
    const { data } = await api.patch<Comment>(
      `/spaces/${spaceId}/entries/${entryId}/comments/${commentId}`,
      { content }
    );
    return data;
  },

  async remove(spaceId: string, entryId: string, commentId: string) {
    await api.delete(`/spaces/${spaceId}/entries/${entryId}/comments/${commentId}`);
  },
};
