import { api } from "./api";
import type { Space, SpaceCreatePayload, SpaceMember } from "../types";

export const spaceService = {
  async list(includeArchived = false) {
    const { data } = await api.get<Space[]>("/spaces", {
      params: { include_archived: includeArchived },
    });
    return data;
  },

  async get(spaceId: string) {
    const { data } = await api.get<Space>(`/spaces/${spaceId}`);
    return data;
  },

  async create(payload: SpaceCreatePayload) {
    const { data } = await api.post<Space>("/spaces", payload);
    return data;
  },

  async update(spaceId: string, payload: Partial<SpaceCreatePayload> & { archived?: boolean }) {
    const { data } = await api.patch<Space>(`/spaces/${spaceId}`, payload);
    return data;
  },

  async remove(spaceId: string) {
    await api.delete(`/spaces/${spaceId}`);
  },

  async members(spaceId: string) {
    const { data } = await api.get<SpaceMember[]>(`/spaces/${spaceId}/members`);
    return data;
  },
};
