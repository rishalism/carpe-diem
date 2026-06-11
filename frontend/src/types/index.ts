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

export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string | null;
  bio?: string | null;
  dark_mode: boolean;
  notification_prefs: Record<string, unknown>;
  created_at: string;
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
