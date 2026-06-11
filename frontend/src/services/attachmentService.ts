import { api } from "./api";
import type { Attachment } from "../types";

export const attachmentService = {
  async listForEntry(spaceId: string, entryId: string) {
    const { data } = await api.get<Attachment[]>(
      `/spaces/${spaceId}/entries/${entryId}/attachments`
    );
    return data;
  },

  async upload(spaceId: string, entryId: string, file: File) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<Attachment>(
      `/spaces/${spaceId}/entries/${entryId}/attachments`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },

  async remove(spaceId: string, entryId: string, attachmentId: string) {
    await api.delete(
      `/spaces/${spaceId}/entries/${entryId}/attachments/${attachmentId}`
    );
  },

  async gallery(spaceId: string) {
    const { data } = await api.get<Attachment[]>(`/spaces/${spaceId}/gallery`);
    return data;
  },
};
