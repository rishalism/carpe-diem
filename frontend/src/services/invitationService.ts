import { api } from "./api";
import type { Invitation, InvitationPublic, MemberRole, Space } from "../types";

export const invitationService = {
  async create(spaceId: string, email: string, role: MemberRole = "member") {
    const { data } = await api.post<Invitation>(
      `/spaces/${spaceId}/invitations`,
      { email, role }
    );
    return data;
  },

  async listForSpace(spaceId: string) {
    const { data } = await api.get<Invitation[]>(`/spaces/${spaceId}/invitations`);
    return data;
  },

  async cancel(spaceId: string, invitationId: string) {
    await api.delete(`/spaces/${spaceId}/invitations/${invitationId}`);
  },

  async getPublic(token: string) {
    const { data } = await api.get<InvitationPublic>(`/invitations/${token}`);
    return data;
  },

  async accept(token: string) {
    const { data } = await api.post<Space>(`/invitations/${token}/accept`);
    return data;
  },

  async decline(token: string) {
    await api.post(`/invitations/${token}/decline`);
  },
};
