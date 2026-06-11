import { api } from "./api";
import type {
  AdminDashboard,
  AdminSpaceDetail,
  AdminSpaceListItem,
  AdminUserDetail,
  AdminUserListItem,
  AIMonitoring,
  AnalyticsSummary,
  AuditLog,
  EntryMetaItem,
  JournalAggregates,
  Paginated,
  ReportCaseDetail,
  ReportListItem,
  ReportListQuery,
  ReportSeverity,
  ResetPasswordResult,
  SpaceListQuery,
  StorageStats,
  SystemHealth,
  UserJourney,
  UserListQuery,
  UserRole,
} from "../types";

/** Drop undefined/empty values so they don't become `?x=undefined`. */
function params(obj: object) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out;
}

export const adminService = {
  dashboard() {
    return api.get<AdminDashboard>("/admin/dashboard").then((r) => r.data);
  },

  // --- users ---
  listUsers(query: UserListQuery = {}) {
    return api
      .get<Paginated<AdminUserListItem>>("/admin/users", { params: params(query) })
      .then((r) => r.data);
  },
  getUser(id: string) {
    return api.get<AdminUserDetail>(`/admin/users/${id}`).then((r) => r.data);
  },
  suspend(id: string, reason: string) {
    return api
      .post<AdminUserDetail>(`/admin/users/${id}/suspend`, { reason })
      .then((r) => r.data);
  },
  reactivate(id: string) {
    return api
      .post<AdminUserDetail>(`/admin/users/${id}/reactivate`)
      .then((r) => r.data);
  },
  ban(id: string, reason: string) {
    return api
      .post<AdminUserDetail>(`/admin/users/${id}/ban`, { reason })
      .then((r) => r.data);
  },
  resetPassword(id: string) {
    return api
      .post<ResetPasswordResult>(`/admin/users/${id}/reset-password`)
      .then((r) => r.data);
  },
  setRole(id: string, role: UserRole) {
    return api
      .patch<AdminUserDetail>(`/admin/users/${id}/role`, { role })
      .then((r) => r.data);
  },
  deleteUser(id: string, confirm_username: string, reason: string) {
    return api
      .post(`/admin/users/${id}/delete`, { confirm_username, reason })
      .then(() => undefined);
  },

  // --- reports / moderation ---
  listReports(query: ReportListQuery = {}) {
    return api
      .get<Paginated<ReportListItem>>("/admin/reports", { params: params(query) })
      .then((r) => r.data);
  },
  getReportCase(id: string) {
    return api.get<ReportCaseDetail>(`/admin/reports/${id}`).then((r) => r.data);
  },
  assignReport(id: string, admin_id?: string) {
    return api
      .post<ReportListItem>(`/admin/reports/${id}/assign`, { admin_id: admin_id ?? null })
      .then((r) => r.data);
  },
  markUnderReview(id: string) {
    return api
      .post<ReportListItem>(`/admin/reports/${id}/under-review`)
      .then((r) => r.data);
  },
  setSeverity(id: string, severity: ReportSeverity) {
    return api
      .patch<ReportListItem>(`/admin/reports/${id}/severity`, { severity })
      .then((r) => r.data);
  },
  dismissReport(id: string, resolution_note: string) {
    return api
      .post<ReportListItem>(`/admin/reports/${id}/dismiss`, { resolution_note })
      .then((r) => r.data);
  },
  removeContent(id: string, resolution_note: string) {
    return api
      .post<ReportListItem>(`/admin/reports/${id}/remove-content`, { resolution_note })
      .then((r) => r.data);
  },

  // --- audit ---
  listAudit(query: { page?: number; action?: string; resource_type?: string } = {}) {
    return api
      .get<Paginated<AuditLog>>("/admin/audit-logs", { params: params(query) })
      .then((r) => r.data);
  },

  // --- Phase 2: analytics & monitoring ---
  userJourney(id: string) {
    return api.get<UserJourney>(`/admin/users/${id}/journey`).then((r) => r.data);
  },
  analytics() {
    return api.get<AnalyticsSummary>("/admin/analytics").then((r) => r.data);
  },
  journalAggregates() {
    return api.get<JournalAggregates>("/admin/monitoring/journal").then((r) => r.data);
  },
  journalEntries(page = 1) {
    return api
      .get<Paginated<EntryMetaItem>>("/admin/monitoring/journal/entries", { params: { page } })
      .then((r) => r.data);
  },
  aiMonitoring() {
    return api.get<AIMonitoring>("/admin/monitoring/ai").then((r) => r.data);
  },
  storageStats() {
    return api.get<StorageStats>("/admin/monitoring/storage").then((r) => r.data);
  },
  systemHealth() {
    return api.get<SystemHealth>("/admin/monitoring/system").then((r) => r.data);
  },

  // --- Phase 2: spaces ---
  listSpaces(query: SpaceListQuery = {}) {
    return api
      .get<Paginated<AdminSpaceListItem>>("/admin/spaces", { params: params(query) })
      .then((r) => r.data);
  },
  getSpace(id: string) {
    return api.get<AdminSpaceDetail>(`/admin/spaces/${id}`).then((r) => r.data);
  },
  archiveSpace(id: string) {
    return api.post<AdminSpaceDetail>(`/admin/spaces/${id}/archive`).then((r) => r.data);
  },
  restoreSpace(id: string) {
    return api.post<AdminSpaceDetail>(`/admin/spaces/${id}/restore`).then((r) => r.data);
  },
  removeSpaceMember(id: string, user_id: string, reason: string) {
    return api
      .post<AdminSpaceDetail>(`/admin/spaces/${id}/remove-member`, { user_id, reason })
      .then((r) => r.data);
  },
  deleteSpace(id: string, confirm_name: string, reason: string) {
    return api
      .post(`/admin/spaces/${id}/delete`, { confirm_name, reason })
      .then(() => undefined);
  },
};
