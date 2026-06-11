// Shared API types — mirror the backend Pydantic schemas.

export type SpaceType = "personal" | "couple" | "family" | "friends" | "custom";
export type MemberRole = "owner" | "member";
export type AIStatus = "none" | "pending" | "done" | "failed";
export type Mood =
  | "happy"
  | "grateful"
  | "excited"
  | "calm"
  | "neutral"
  | "tired"
  | "anxious"
  | "sad"
  | "angry";

export type UserRole = "user" | "moderator" | "admin" | "super_admin";

export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string | null;
  bio?: string | null;
  dark_mode: boolean;
  notification_prefs: Record<string, unknown>;
  created_at: string;
  role: UserRole;
}

export interface UserSummary {
  id: string;
  username: string;
  avatar_url?: string | null;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Space {
  id: string;
  name: string;
  description?: string | null;
  type: SpaceType;
  cover_image_url?: string | null;
  owner_id: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
  member_count: number;
  entry_count: number;
  current_user_role: MemberRole | null;
}

export interface SpaceMember {
  id: string;
  role: MemberRole;
  joined_at: string;
  user: UserSummary;
}

export interface JournalEntry {
  id: string;
  space_id: string;
  title: string;
  content: string;
  content_enhanced?: string | null;
  enhanced_active: boolean;
  ai_status: AIStatus;
  mood?: Mood | null;
  tags: string[];
  author: UserSummary;
  created_at: string;
  updated_at: string;
}

export interface SpaceCreatePayload {
  name: string;
  type: SpaceType;
  description?: string;
  cover_image_url?: string;
}

export interface EntryCreatePayload {
  title: string;
  content: string;
  mood?: Mood | null;
  tags: string[];
  use_ai: boolean;
}

export interface EntryUpdatePayload {
  title?: string;
  content?: string;
  mood?: Mood | null;
  tags?: string[];
  enhanced_active?: boolean;
  use_ai?: boolean;
}

// ---- Phase 2 ----

export type ReactionType = "heart" | "thumbs_up" | "smile" | "party" | "sad";

export type InvitationStatus = "pending" | "accepted" | "declined" | "expired";

export type NotificationType =
  | "space_invitation"
  | "invitation_accepted"
  | "new_entry"
  | "new_comment"
  | "member_joined";

export interface Comment {
  id: string;
  entry_id: string;
  parent_id: string | null;
  content: string;
  author: UserSummary;
  created_at: string;
  updated_at: string;
  replies: Comment[];
}

export interface ReactionSummary {
  counts: Record<string, number>;
  mine: string[];
  total: number;
}

export interface Invitation {
  id: string;
  space_id: string;
  email: string;
  role: MemberRole;
  status: InvitationStatus;
  token: string;
  created_at: string;
  expires_at?: string | null;
  inviter: UserSummary;
}

export interface InvitationPublic {
  token: string;
  status: InvitationStatus;
  email: string;
  role: MemberRole;
  space_name: string;
  inviter_name: string;
  expires_at?: string | null;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  payload: Record<string, string>;
  read: boolean;
  created_at: string;
  actor?: UserSummary | null;
}

export interface NotificationList {
  items: AppNotification[];
  unread_count: number;
}

// ---- Phase 3 ----

export interface Attachment {
  id: string;
  entry_id: string;
  file_url: string;
  file_name: string;
  file_type?: string | null;
  file_size?: number | null;
  uploader: UserSummary;
  created_at: string;
}

export interface AppConfig {
  ai_enabled: boolean;
  supabase_enabled: boolean;
  google_enabled: boolean;
  google_client_id: string;
  max_file_size_mb: number;
}

export interface DashboardSummary {
  total_spaces: number;
  total_entries: number;
  streak_days: number;
  entries_this_month: number;
  mood_counts: Record<string, number>;
  recent_entries: EntrySearchResult[];
  on_this_day: EntrySearchResult[];
}

export interface EntrySearchResult extends JournalEntry {
  space_name: string;
}

export interface SearchFilters {
  q?: string;
  mood?: Mood;
  tag?: string;
  space_id?: string;
  date_from?: string;
  date_to?: string;
}

// ---- Admin portal ----

export type AccountStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "banned"
  | "deleted";
export type ReportContentType = "entry" | "comment";
export type ReportStatus =
  | "open"
  | "under_review"
  | "action_taken"
  | "dismissed";
export type ReportSeverity = "low" | "medium" | "high" | "critical";

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface AdminUserListItem {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  account_status: AccountStatus;
  auth_method: "google" | "password";
  created_at: string;
  last_active_at?: string | null;
  total_spaces: number;
  total_entries: number;
  total_reports_against: number;
}

export interface AdminUserDetail extends AdminUserListItem {
  bio?: string | null;
  avatar_url?: string | null;
  suspension_reason?: string | null;
  total_comments: number;
  total_reactions: number;
}

export interface ResetPasswordResult {
  detail: string;
  temporary_link?: string | null;
}

export interface AuditLog {
  id: string;
  admin_id?: string | null;
  admin_name: string;
  admin_role: string;
  action: string;
  resource_type?: string | null;
  resource_id?: string | null;
  reason?: string | null;
  result: string;
  ip_address?: string | null;
  created_at: string;
}

export interface ReportListItem {
  id: string;
  content_type: ReportContentType;
  content_id: string;
  reported_user_id?: string | null;
  reporter_id?: string | null;
  reason: string;
  status: ReportStatus;
  severity: ReportSeverity;
  assigned_admin_id?: string | null;
  created_at: string;
}

export interface ReportCaseDetail extends ReportListItem {
  details?: string | null;
  resolution_note?: string | null;
  reported_username?: string | null;
  content_title?: string | null;
  content_body?: string | null;
  content_exists: boolean;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface AdminDashboard {
  total_users: number;
  active_users_7d: number;
  new_signups_7d: number;
  total_spaces: number;
  total_entries: number;
  entries_24h: number;
  open_reports: number;
  suspended_users: number;
  signups_trend: TrendPoint[];
}

export interface UserListQuery {
  page?: number;
  page_size?: number;
  status?: AccountStatus;
  role?: UserRole;
  q?: string;
}

export interface ReportListQuery {
  page?: number;
  page_size?: number;
  status?: ReportStatus;
  severity?: ReportSeverity;
  unassigned?: boolean;
}

// ---- Admin portal · Phase 2 (analytics & monitoring) ----

export interface FunnelStep {
  key: string;
  label: string;
  count: number;
  pct: number;
}

export interface EngagementStats {
  dau: number;
  wau: number;
  mau: number;
  stickiness: number;
  entries_per_active: number;
  comments_per_active: number;
  reactions_per_active: number;
}

export interface AnalyticsSummary {
  total_users: number;
  signups_google: number;
  signups_password: number;
  growth_trend: TrendPoint[];
  cumulative_users: number;
  funnel: FunnelStep[];
  engagement: EngagementStats;
  retention_d1: number;
  retention_d7: number;
  retention_d30: number;
  retention_basis: string;
}

export interface JournalAggregates {
  total_entries: number;
  entries_today: number;
  entries_7d: number;
  entries_30d: number;
  mood_counts: Record<string, number>;
  attachment_rate: number;
  ai_enhanced_rate: number;
  reported_entries: number;
}

export interface EntryMetaItem {
  entry_id: string;
  space_id: string;
  author_user_id: string;
  created_at: string;
  mood?: Mood | null;
  has_attachments: boolean;
  ai_status: AIStatus;
  comment_count: number;
  reaction_count: number;
  is_reported: boolean;
}

export interface AIMonitoring {
  total_entries: number;
  by_status: Record<string, number>;
  success_rate: number;
  failure_rate: number;
  ai_enhanced_rate: number;
  adoption_pct: number;
  requests_24h: number;
  requests_7d: number;
  note: string;
}

export interface LargestObject {
  id: string;
  file_name: string;
  file_size?: number | null;
  file_type?: string | null;
  space_id?: string | null;
}

export interface StorageStats {
  backend: string;
  total_attachments: number;
  total_bytes: number;
  avg_bytes: number;
  by_type: Record<string, number>;
  largest: LargestObject[];
}

export interface SystemHealth {
  status: string;
  db_ok: boolean;
  ai_enabled: boolean;
  ai_pending: number;
  ai_oldest_pending_age_seconds?: number | null;
  ai_failed_24h: number;
  storage_backend: string;
  total_users: number;
  total_entries: number;
}

export interface AdminSpaceListItem {
  id: string;
  name: string;
  type: SpaceType;
  owner_id: string;
  owner_username?: string | null;
  member_count: number;
  entry_count: number;
  pending_invitations: number;
  archived: boolean;
  created_at: string;
  last_activity_at?: string | null;
}

export interface SpaceMemberItem {
  user_id: string;
  username: string;
  role: string;
  joined_at: string;
}

export interface SpaceInvitationItem {
  email: string;
  status: string;
  created_at: string;
}

export interface AdminSpaceDetail extends AdminSpaceListItem {
  description?: string | null;
  members: SpaceMemberItem[];
  invitations: SpaceInvitationItem[];
}

export interface JourneyEvent {
  type: string;
  label: string;
  at?: string | null;
}

export interface UserJourney {
  stage: string;
  events: JourneyEvent[];
  retained_d1: boolean;
  retained_d7: boolean;
  retained_d30: boolean;
}

export interface SpaceListQuery {
  page?: number;
  page_size?: number;
  type?: SpaceType;
  archived?: boolean;
  q?: string;
}
