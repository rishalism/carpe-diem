# Carpe Diem — Admin Portal

## Product Requirements Specification (PRS / PRD)

| | |
|---|---|
| **Document Status** | Draft v1.0 — for stakeholder review & developer handoff |
| **Product** | Carpe Diem Admin Portal (back-office) |
| **Owner** | Platform Owner |
| **Last Updated** | 2026-06-11 |
| **Audience** | Platform Owner, Super Admins, Admins, Moderators, Engineering |
| **Related Systems** | Carpe Diem user-facing app (complete), Backend API (FastAPI), Frontend (Vite/React) |

---

## 1. Executive Summary

Carpe Diem is a journaling and social-spaces platform with AI-powered writing features. The user-facing product is complete; users write private and shared journal entries inside **Spaces** (personal, couple, family, friends, custom), react and comment on entries, and optionally enhance their writing with AI.

The **Admin Portal** is a separate back-office application that gives platform operators complete operational visibility while strictly protecting user privacy. It serves five primary jobs:

1. **Monitoring** — real-time view of platform health, traffic, and activity.
2. **Analytics** — growth, retention, engagement, and AI performance trends.
3. **User management** — account lifecycle, support actions, and investigation.
4. **Moderation** — review reported content and enforce community standards.
5. **System health** — service status, error rates, storage, and operational alerts.

### Guiding principles

- **Privacy first.** Journal content is private by default and is **never** rendered in the portal unless an entry has been **reported by a user or flagged by an automated rule** and is being actively moderated. Aggregate counts and metadata are always available; raw content is not.
- **Audit everything.** Every state-changing admin action is recorded with **Admin Name, Action, Resource, Timestamp, IP Address**, and (where applicable) a reason. Audit logs are append-only.
- **Least privilege.** Access is role-based: Super Admin, Admin, Moderator. No role can perform actions outside its grant; the portal hides controls the current role cannot use.
- **Real-time where it matters.** Operational dashboards reflect current state; analytical views support daily / weekly / monthly windows.
- **Performance & safety.** All lists, searches, and filters are paginated and index-backed. Secrets and password hashes are never returned to the client, never logged, and never displayed.

### Scope

In scope: monitoring, analytics, user and space administration, content moderation of reported items, AI/storage/system observability, admin/role management, platform settings, global search, and audit logging.

Out of scope (v1): editing user journal content, billing/subscriptions, marketing automation, and end-user feature flags beyond platform-level toggles.

---

## 2. Feature Overview

The portal is organized into the following functional areas. Sections 2.1–2.16 are specified in detail in [Section 3](#3-detailed-feature-specifications).

| # | Area | Purpose | Min. Role |
|---|------|---------|-----------|
| 1 | **Dashboard / Overview** | At-a-glance platform KPIs and live activity | Moderator |
| 2 | **User Management** | Account list, lifecycle actions, support | Admin |
| 3 | **User Profile (Detail)** | Deep view of a single user | Admin |
| 4 | **User Journey** | Per-user activity timeline & funnel position | Admin |
| 5 | **Space Management** | Spaces inventory, membership, type breakdown | Admin |
| 6 | **Journal Monitoring** | Entry **metadata** & volume (privacy-safe) | Admin |
| 7 | **AI Monitoring** | AI request volume, success rate, latency, cost | Admin |
| 8 | **Storage Management** | Attachment/storage usage and health | Admin |
| 9 | **Reports & Moderation** | Review reported/flagged content; enforce policy | Moderator |
| 10 | **Analytics** | Growth, retention, engagement, cohort trends | Admin |
| 11 | **Notifications** | Platform notification delivery & admin broadcasts | Admin |
| 12 | **Audit Logs** | Append-only record of all admin actions | Admin (read), Super Admin (export) |
| 13 | **System Health** | Service status, error rate, queue, DB, uptime | Moderator (view) |
| 14 | **Admin Management** | Manage admin accounts and role grants | Super Admin |
| 15 | **Platform Settings** | Global toggles, limits, integrations | Super Admin |
| 16 | **Global Search** | Cross-entity lookup (users, spaces, reports) | Moderator |

> The portal counts **16** specified areas, covering all eight required major domains (Dashboard, Users, Spaces, Journals, AI, Storage, Reports, Analytics) plus System Health, Admin Roles, Settings, Search, and Audit.

---

## 3. Detailed Feature Specifications

Each section below follows a consistent template: **Purpose → Data Display → Available Actions → Filters → Search → Validation Rules**. Field names are written in `code style`; they map to backend API fields and, where they exist, to the current data model (`users`, `spaces`, `entries`, `comments`, `reactions`, `notifications`, `invitations`, `attachments`, `tags`).

> **New backend objects required.** The current schema has no `account_status`, no admin/role model, no report model, and no audit-log table. This PRD specifies these as new entities (see [§6](#6-audit--compliance-requirements) and [§9](#9-implementation-priorities)).

---

### 3.1 Dashboard / Overview

**Purpose:** Single landing screen summarizing platform state. Loads fast; auto-refreshes live tiles.

#### Data Display

Top KPI tiles (each shows current value + delta vs. previous period):
- `total_users` (all-time) and `active_users_24h` / `active_users_7d`
- `new_signups_today` / `new_signups_7d`
- `total_spaces` and `spaces_created_7d`
- `total_entries` and `entries_created_24h`
- `ai_requests_24h` with `ai_success_rate_24h`
- `open_reports` (moderation queue depth)
- `storage_used` (GB) and `storage_used_pct`
- `system_status` (Operational / Degraded / Down)

Supporting widgets:
- **Live activity feed** — rolling stream of non-sensitive events (`user.registered`, `space.created`, `entry.created` *(metadata only)*, `report.opened`). No entry content.
- **Signups trend** — line chart, daily, last 30 days.
- **Engagement sparkline** — entries/day, comments/day, reactions/day.
- **Top spaces by activity** (last 7d) — space name, type, member count, entry count.
- **Alerts panel** — surfaced from System Health (error spikes, queue backlog, storage > 80%).

#### Available Actions
- Switch period for trend widgets (`24h` / `7d` / `30d`).
- Drill through any tile to its source section (e.g., `open_reports` → Reports & Moderation).
- Toggle live-feed auto-refresh; manual refresh.
- Export dashboard snapshot (CSV/PNG) — Admin+.

#### Filters
- Time window: `Today`, `Last 7 days`, `Last 30 days`.
- Activity-feed event type (multi-select).

#### Search
- Inline jump-to via [Global Search](#316-global-search).

#### Validation Rules
- Live feed must exclude all entry/comment **content**; only metadata and IDs.
- KPI deltas must state the comparison window explicitly (no ambiguous "+12%").
- Tiles must degrade gracefully (show last-known value + staleness badge) if a metric source is unavailable.

---

### 3.2 User Management

**Purpose:** Locate, inspect, and act on user accounts for support, investigation, and enforcement.

#### Data Display

Searchable, sortable, paginated table:
- `user_id` (UUID, unique identifier)
- `username` (clickable → User Profile)
- `email`
- `auth_method` (Password / Google)
- `registration_date` (`created_at`)
- `last_active_date`
- `account_status` (**Active**, **Inactive**, **Suspended**, **Banned**, **Deleted**)
- `total_spaces` (owned + member)
- `total_entries`
- `total_ai_actions` (count of AI requests)
- `total_reports_against` (content reports attributed to this user)

#### Available Actions
- **View User Profile** — navigate to [§3.3](#33-user-profile-detail).
- **Suspend User** — disables login; requires `reason`; records audit log. Reversible.
- **Reactivate User** — re-enables a suspended account; records audit log.
- **Ban User** — permanent access removal; requires `reason`; records audit log. (Reversible only by Super Admin.)
- **Delete User** — soft delete (`status = Deleted`, PII minimized per [§5](#5-privacy--security-guidelines)); retains audit trail. **Super Admin confirmation required.**
- **Reset User Password** — generates a temporary token, sends reset link via email; never displays or logs the password/hash. (Password accounts only.)
- **Send Notification** — push a platform notification to the user (links to [§3.11](#311-notifications)).
- **Export User Data** — generate a privacy-compliant data export (Super Admin).

#### Filters
- `Active Users`
- `Inactive Users` (no login in 30+ days)
- `Suspended Users`
- `Banned Users`
- `New Users` (registered in last 7 days)
- `Google sign-in` vs. `Password` (`auth_method`)
- `Has reports against` (≥ 1)
- Registration date range; last-active date range.

#### Search
- By `username` (partial, case-insensitive)
- By `email` (exact + partial)
- By `user_id` (exact)

#### Validation Rules
- **Suspend / Ban / Delete** require a non-empty `reason` (min 5 chars), stored in the audit log.
- **Delete User** requires explicit Super Admin confirmation (typed confirmation of username).
- **Reset Password** must log the initiating admin; the temporary credential is transmitted only via the email channel.
- `password_hash`, `google_id`, and raw tokens must never appear in any list, detail view, export, or log.
- Status transitions are constrained: `Banned`/`Deleted` cannot self-reactivate; only the documented role can reverse them.

---

### 3.3 User Profile (Detail)

**Purpose:** Consolidated 360° view of one user for support and investigation — **without** exposing private journal content.

#### Data Display
- **Identity:** `username`, `email`, `avatar_url`, `bio`, `auth_method`, `account_status`, `created_at`, `last_active_date`.
- **Settings (read-only):** `dark_mode`, `notification_prefs` (JSON, rendered as labeled toggles).
- **Spaces:** list of spaces the user owns or belongs to — `space_name`, `space_type`, `member_role` (owner/member), `joined_at`, `entry_count`. Clickable → [§3.5](#35-space-management).
- **Activity summary:** `total_entries`, `entries_last_30d`, `total_comments`, `total_reactions`, `total_ai_actions`, `ai_success_rate`.
- **Moderation history:** reports filed **by** the user, reports **against** the user, prior enforcement actions (suspensions/bans) with timestamps and reasons.
- **Account events:** registration, logins (count + last), password resets, status changes (sourced from audit log).

> **Privacy note:** Entry titles and bodies are **not** shown here. Only counts, dates, mood distribution (aggregate), and space membership are displayed.

#### Available Actions
- All lifecycle actions from [§3.2](#32-user-management) (Suspend, Reactivate, Ban, Delete, Reset Password, Send Notification, Export Data) — role-gated identically.
- **View User Journey** → [§3.4](#34-user-journey).
- **Impersonate (read-only support view)** — Super Admin only; time-boxed, fully audited, **cannot** read private entry content.

#### Filters
- Within the profile's space/activity sub-lists: by `space_type`, by date range.

#### Search
- N/A (single-record view); reached via list or Global Search.

#### Validation Rules
- Impersonation sessions must be audit-logged at start and end, auto-expire, and remain bound by the privacy rule (no private content).
- Any destructive action surfaces a confirmation modal restating the user and the reason requirement.

---

### 3.4 User Journey

**Purpose:** Chronological, funnel-aware view of a single user's lifecycle for retention analysis and support context.

#### Data Display
- **Lifecycle timeline:** ordered events — `registered` → `first_space_created` → `first_entry` → `first_ai_use` → `first_invite_sent`/`accepted` → recent activity. Each node shows timestamp and time-since-previous.
- **Funnel position:** where the user currently sits (e.g., *Activated*, *Habitual*, *Dormant*, *Churned*) based on activity recency thresholds.
- **Engagement chart:** entries/comments/reactions per week since registration.
- **AI adoption:** first AI use date, AI usage frequency, success rate.
- **Retention markers:** Day 1 / Day 7 / Day 30 returned (yes/no), current streak / longest streak.

> Content remains hidden — events are represented by type and timestamp only.

#### Available Actions
- Jump to related entity (space, report) from any timeline node.
- Export journey timeline (CSV) — Admin+.
- Trigger re-engagement notification — Admin+ (links to [§3.11](#311-notifications)).

#### Filters
- Event type (registration, space, entry, AI, social, moderation).
- Date range / lifecycle stage.

#### Search
- N/A (single-record view).

#### Validation Rules
- Funnel-stage thresholds are configured in Platform Settings; the view must show which definition version produced the classification.
- No journal titles/bodies in any timeline node.

---

### 3.5 Space Management

**Purpose:** Inventory and oversight of Spaces (the containers for journaling and social activity).

#### Data Display

Sortable, paginated table:
- `space_id`
- `space_name` (clickable → space detail)
- `space_type` (`personal`, `couple`, `family`, `friends`, `custom`)
- `owner_username` (clickable → User Profile)
- `member_count`
- `entry_count`
- `created_at`
- `last_activity_at`
- `pending_invitations` (count)
- `status` (Active / Archived / Suspended)

**Space detail** adds: member roster (`username`, `member_role`, `joined_at`), invitation list (`invitee_email`, `invitation_status` — pending/accepted/declined/expired), activity sparkline, attachment storage used by the space.

#### Available Actions
- **View Space Detail.**
- **View Members** (→ User Profile per member).
- **Suspend Space** — hides space from members pending review; requires `reason`; audited.
- **Archive Space** — read-only freeze; audited.
- **Restore Space** — reverse suspend/archive; audited.
- **Remove Member** — Super Admin/Admin; requires `reason`; audited.
- **Revoke Pending Invitation** — audited.

#### Filters
- By `space_type` (multi-select).
- By `status` (Active / Archived / Suspended).
- `Empty spaces` (0 entries).
- `Large spaces` (member_count ≥ N or entry_count ≥ N).
- `Inactive spaces` (no activity in 30+ days).
- Created-date range.

#### Search
- By `space_name` (partial).
- By `space_id` (exact).
- By `owner_username` / owner email.

#### Validation Rules
- Suspending/archiving/restoring a space and removing a member each require a `reason` and produce an audit record.
- Space **content** (entry bodies) is never shown here; only counts and titles-suppressed metadata.
- Removing the owner is blocked unless ownership is first reassigned or the space is archived.

---

### 3.6 Journal Monitoring

**Purpose:** Observe journaling **volume and metadata** at platform scale while preserving the privacy guarantee. This section is explicitly **not** a content reader.

#### Data Display

Aggregate panels:
- `total_entries`, `entries_today`, `entries_7d`, `entries_30d`.
- Entry-creation trend (daily line, selectable window).
- **Mood distribution** (aggregate counts across `happy, grateful, excited, calm, neutral, tired, anxious, sad, angry`) — never tied to displayed content.
- Attachment rate (% of entries with ≥1 photo `attachment`).
- AI-enhanced rate (% of entries with `ai_status = done`).
- Entries-per-space and entries-per-user distributions (histograms).

Metadata table (privacy-safe — **no title, no body**):
- `entry_id`
- `space_id` (clickable → space)
- `author_user_id` (clickable → profile)
- `created_at`
- `mood`
- `has_attachments` (bool)
- `ai_status` (`none` / `pending` / `done` / `failed`)
- `comment_count`, `reaction_count`
- `is_reported` (bool)

#### Available Actions
- Drill an `entry_id` to its **metadata** record (still no content).
- If `is_reported = true`, jump to the corresponding case in [§3.9](#39-reports--moderation) — content becomes viewable **only** inside the moderation case, per policy.
- Export aggregate metrics (CSV) — Admin+.

#### Filters
- Date range; `mood`; `ai_status`; `has_attachments`; `is_reported`.
- By `space_type`.

#### Search
- By `entry_id` (returns metadata only).
- By `space_id` / `author_user_id`.

#### Validation Rules
- **Hard rule:** entry `title` and `body` are never returned by any Journal Monitoring endpoint. The only path to content is an open moderation case ([§3.9](#39-reports--moderation)).
- Any attempt to access content outside a moderation context is rejected server-side and logged as a security event.
- Mood/attachment/AI aggregates must be computed server-side; raw rows used for aggregation are not exposed.

---

### 3.7 AI Monitoring

**Purpose:** Track AI writing-enhancement usage, reliability, latency, and cost. (AI runs as a non-blocking background task via OpenRouter; entries always save regardless of AI outcome.)

#### Data Display
- **Volume:** `ai_requests_today` / `7d` / `30d`; requests/hour trend.
- **Reliability:** `ai_success_rate` (done ÷ total), `ai_failure_rate`, breakdown by `ai_status` (`pending`, `done`, `failed`).
- **Latency:** p50 / p95 / p99 processing time; pending-queue depth and oldest-pending age.
- **Cost (if available):** tokens consumed, estimated spend per day, cost per successful enhancement, model id in use.
- **Adoption:** % of active users who used AI, AI-enhanced entry rate.
- **Failure analysis table:** `request_id`, `entry_id` (metadata link), `failure_reason`/error class, `timestamp`, retry state. **No prompt or content text.**

#### Available Actions
- Inspect a failed request's error metadata (no content).
- **Retry failed batch** — re-queue stuck/failed jobs (Admin+); audited.
- **Pause / Resume AI processing** — global kill-switch (Super Admin); audited and reflected in Platform Settings & System Health.
- Export AI metrics (CSV) — Admin+.

#### Filters
- Date range; `ai_status`; failure reason/error class; model id.

#### Search
- By `request_id` / `entry_id` (metadata only).

#### Validation Rules
- AI request logs must store **error/metadata only** — never the user's prompt text, entry content, or model output.
- Success rate must define numerator/denominator explicitly (e.g., `done / (done + failed)`, excluding `pending`).
- Pausing AI must surface a visible banner in the portal and not break entry creation.

---

### 3.8 Storage Management

**Purpose:** Monitor attachment/object storage (Supabase bucket in production, local `./uploads` fallback) for capacity and health.

#### Data Display
- `storage_used` (GB), `storage_quota`, `storage_used_pct`.
- Growth trend (daily/weekly).
- `total_attachments`, average attachment size, largest objects (size, owning space/user — metadata only).
- Storage backend in use (`supabase` / `local`) and bucket name.
- Orphaned-object count (attachments with no parent entry).
- Failed-upload rate.

#### Available Actions
- **Recalculate usage** (trigger re-scan).
- **Purge orphaned objects** — Super Admin; requires confirmation; audited.
- **Flag oversized space/user** for review.
- Export storage report (CSV) — Admin+.

#### Filters
- By backend (`supabase` / `local`).
- By `space_type`; by size threshold; by date.
- `Orphaned only`.

#### Search
- By `space_id` / `user_id` to view their storage footprint.
- By `attachment_id` (metadata: size, type, owner, created_at — never the file content/preview unless tied to an open moderation case).

#### Validation Rules
- Purge actions are irreversible → require typed confirmation + Super Admin role + audit record.
- Image previews are not rendered in Storage Management; only file metadata. (Visual review happens only within a moderation case.)
- Quota threshold breaches (e.g., 80%, 95%) raise System Health alerts.

---

### 3.9 Reports & Moderation

**Purpose:** The **only** place where reported/flagged journal content may be reviewed, and where enforcement decisions are made. Central to the privacy model.

#### Data Display

Moderation queue (sortable, paginated):
- `report_id`
- `content_type` (`entry`, `comment`)
- `content_id`
- `reported_user_id` (author — clickable → profile)
- `reporter` (user id, or `system` for automated flags)
- `report_reason` (e.g., harassment, spam, self-harm, explicit, other)
- `report_status` (**Open**, **Under Review**, **Action Taken**, **Dismissed**)
- `severity` (Low / Medium / High / Critical)
- `created_at`
- `assigned_moderator`

**Case detail** (privacy exception — content is shown here):
- The reported `entry`/`comment` **content** (title + body or comment text) — visible **only** because the item is reported and the case is open.
- Surrounding context (space type, author moderation history, prior reports on this content).
- Reporter notes; automated-flag rationale if `system`.
- Decision/action history for this case.

#### Available Actions
- **Assign / Claim case** to a moderator.
- **Mark Under Review.**
- **Dismiss Report** (no violation) — requires `resolution_note`; audited.
- **Remove Content** — hide/takedown the entry or comment from users; requires `reason`; audited.
- **Warn User** — send a policy warning notification; audited.
- **Escalate** — raise severity / route to Admin or Super Admin.
- **Apply User Enforcement** — Suspend / Ban the author (delegates to [§3.2](#32-user-management) actions); audited.
- **Add internal note** to the case.

#### Filters
- `report_status` (Open / Under Review / Action Taken / Dismissed).
- `severity`; `report_reason`; `content_type`.
- `Unassigned`; `Assigned to me`.
- `Automated flags` vs. `User reports`.
- Created-date range.

#### Search
- By `report_id`, `content_id`, `reported_user_id`, or reporter.

#### Validation Rules
- **Content access is gated:** opening reported content is permitted **only** within an open moderation case and is itself audit-logged (`moderation.content_viewed`).
- Dismiss/Remove/Warn/Enforce all require a note or reason and produce audit records.
- Once a report is closed (`Action Taken` / `Dismissed`), content access reverts to hidden; reopening is audited.
- Reporter identity is masked from the reported user and from non-moderation views.
- A moderator cannot adjudicate a report they filed (conflict-of-interest guard).

---

### 3.10 Analytics

**Purpose:** Strategic, trend-level insight into growth, retention, and engagement. Aggregates only — no PII beyond what list views already permit, no content.

#### Data Display
- **Growth:** new signups (daily/weekly/monthly), cumulative users, growth rate %, signups by `auth_method`.
- **Retention:** **Day 1 / Day 7 / Day 30** retention; weekly cohort retention grid; churn rate; resurrection (returning dormant users).
- **Engagement:** DAU / WAU / MAU and **stickiness (DAU/MAU)**; entries per active user; comments & reactions per active user; reaction-type mix (`heart, thumbs_up, smile, party, sad`).
- **Spaces:** spaces created over time; type distribution; avg members per space; invitation acceptance rate.
- **AI:** adoption %, AI success-rate trend, AI-enhanced-entry share.
- **Funnel:** Registered → Created Space → Wrote Entry → Used AI → Invited Others, with conversion % at each step.

All views support **daily / weekly / monthly** windows and period-over-period comparison.

#### Available Actions
- Switch granularity (daily/weekly/monthly) and comparison period.
- Build cohort by registration week; filter cohort by `auth_method` or `space_type`.
- Export any chart's underlying aggregate (CSV) — Admin+.
- Save a view as a named report.

#### Filters
- Date range; cohort definition; `space_type`; `auth_method`; new vs. returning.

#### Search
- N/A (aggregate dashboards).

#### Validation Rules
- Every metric must publish its definition (e.g., "active = ≥1 login OR ≥1 entry in window"). Definitions live in Platform Settings.
- Retention/cohort math must be reproducible and timezone-consistent (store UTC; display in configured tz).
- No drill-through from analytics may expose journal content.

---

### 3.11 Notifications

**Purpose:** Observe platform notification delivery and send admin-originated messages.

#### Data Display
- Notification volume by `notification_type` (`space_invitation`, `invitation_accepted`, `new_entry`, `new_comment`, `member_joined`) + any admin/system types.
- Delivery trend; read vs. unread rate; failed-delivery count.
- **Admin broadcast history:** message, audience segment, sent-by admin, timestamp, reach, read rate.

#### Available Actions
- **Send notification to a user** (from User Management/Profile).
- **Broadcast to a segment** (e.g., all active users, a cohort, users of a space type) — Admin+; requires preview + confirmation; audited.
- **Cancel scheduled broadcast.**
- Export delivery metrics (CSV).

#### Filters
- By `notification_type`; delivery status (delivered/failed/read/unread); date range; audience segment.

#### Search
- By `user_id` (their notification log — metadata, not message content of personal notifications beyond type).
- By broadcast id.

#### Validation Rules
- Broadcasts require an explicit audience definition and a confirmation step showing estimated reach before send.
- Broadcast content is audit-logged with the sending admin; broadcasts cannot include or request sensitive user data.
- Respect each user's `notification_prefs`; opt-outs are honored except for mandatory policy/safety notices.

---

### 3.12 Audit Logs

**Purpose:** Append-only, tamper-evident record of every state-changing admin action. The backbone of accountability ([§6](#6-audit--compliance-requirements)).

#### Data Display

Read-only, sortable, paginated table:
- `audit_id`
- `admin_name` (and `admin_id`)
- `admin_role` (at time of action)
- `action` (e.g., `user.suspend`, `report.remove_content`, `space.archive`, `settings.update`)
- `resource_type` + `resource_id` (the target)
- `reason` / note (where applicable)
- `timestamp` (UTC)
- `ip_address`
- `user_agent`
- `result` (success / denied / error)

#### Available Actions
- View entry detail (full before/after where captured).
- **Export logs** (CSV/JSON) — **Super Admin only**.
- Create a saved filter / alert (e.g., notify on any `user.delete`).

#### Filters
- By `admin_name` / `admin_id`; by `action`; by `resource_type`; by `result`.
- Date/time range; by `ip_address`.
- High-risk actions only (delete, ban, settings change, content view).

#### Search
- By `audit_id`, `resource_id`, `admin_name`, or `ip_address`.

#### Validation Rules
- Logs are **append-only**: no edit or delete via the portal or API (enforced at the DB/service layer).
- Every entry must contain at minimum: **Admin Name, Action, Resource, Timestamp, IP Address**.
- Moderation **content views** are logged (`moderation.content_viewed`).
- Failed/denied authorization attempts are logged.
- Retention per [§6](#6-audit--compliance-requirements); export is itself an audited action.

---

### 3.13 System Health

**Purpose:** Operational status of the platform's services and infrastructure.

#### Data Display
- **Overall status:** Operational / Degraded / Down (derived).
- **API:** uptime %, request rate, error rate (4xx/5xx), p50/p95/p99 latency, `/health` check result.
- **Database:** connection status, pool utilization, slow-query count, size.
- **AI pipeline:** queue depth, oldest pending job, processing status (active/paused).
- **Storage:** backend status, usage % (mirrors [§3.8](#38-storage-management)).
- **Auth:** login success/failure rate, token-refresh rate, suspected brute-force spikes.
- **Background jobs / rate-limiter** status.
- **Incident/alert timeline.**

#### Available Actions
- Acknowledge / silence an alert (audited).
- Trigger a manual health re-check.
- Link to AI pause/resume ([§3.7](#37-ai-monitoring)) when the pipeline is the cause.
- Export incident timeline.

#### Filters
- By component (API / DB / AI / Storage / Auth); by severity; date range.

#### Search
- By incident/alert id.

#### Validation Rules
- Status thresholds (e.g., error rate > 2% = Degraded) are defined in Platform Settings and shown alongside status.
- Alerts must include component, metric, threshold, and observed value.
- Health endpoints must not expose secrets, connection strings, or internal hostnames to the client.

---

### 3.14 Admin Management

**Purpose:** Manage the admin accounts and their role grants. **Super Admin only.**

#### Data Display
- `admin_id`, `admin_name`, `email`, `role` (Super Admin / Admin / Moderator), `status` (Active / Disabled), `created_at`, `last_login`, `2fa_enabled`, `last_action_at`.

#### Available Actions
- **Invite / Create admin** (assign role).
- **Change role** (promote/demote) — audited.
- **Disable / Re-enable admin** — audited.
- **Revoke sessions / force re-login.**
- **Require / reset 2FA.**
- **Remove admin** — requires confirmation; audited.

#### Filters
- By `role`; by `status`; last-login range.

#### Search
- By `admin_name` / `email` / `admin_id`.

#### Validation Rules
- Only **Super Admin** can access this section or change roles.
- The system must always retain **at least one active Super Admin** (cannot demote/disable/remove the last one).
- An admin cannot change their **own** role or disable their own account.
- All role/grant changes are audited with before/after role.
- 2FA strongly recommended (configurable as required) for all admin accounts.

---

### 3.15 Platform Settings

**Purpose:** Global configuration. **Super Admin only.**

#### Data Display & Configurable Items
- **Feature toggles:** AI enhancement on/off, Google sign-in on/off, new-signups open/closed, attachments on/off.
- **Limits:** max members per space, max attachment size, max spaces per user, rate-limit thresholds.
- **AI config:** active `OPENROUTER_MODEL` (display id), retry policy, pause switch.
- **Storage config:** backend (`supabase`/`local`), bucket name, quota & alert thresholds (80% / 95%).
- **Metric definitions:** "active user" rule, retention windows, System Health thresholds, funnel-stage cutoffs.
- **Moderation policy:** report reasons taxonomy, auto-flag rules, default severity mapping.
- **Security:** access-token / refresh-token lifetimes (display), session policy, 2FA requirement, IP allowlist for admin portal (optional).
- **Data retention:** audit-log retention period, soft-deleted-user retention.

#### Available Actions
- Edit any setting (with confirmation); changes are versioned and audited (before/after).
- Roll back to a previous settings version.

#### Filters / Search
- Search settings by name/category.

#### Validation Rules
- All settings changes require Super Admin and are audited with before/after values.
- Numeric limits validated against safe ranges; secrets (API keys, service keys) are **write-only** (never displayed after entry) and never logged.
- Changing a metric definition records the version so historical analytics remain interpretable.

---

### 3.16 Global Search

**Purpose:** Fast cross-entity lookup from anywhere in the portal.

#### Data Display
- Unified results grouped by type: **Users**, **Spaces**, **Reports**, **Admins** (Super Admin only). Each result shows identifying metadata and a deep link.

#### Available Actions
- Navigate to the entity's detail page.
- Refine by entity type.

#### Filters
- Entity type (Users / Spaces / Reports / Admins).
- Status facets per type (e.g., user `account_status`, report `report_status`).

#### Search
- Query matches: `username`, `email`, `user_id`, `space_name`, `space_id`, `report_id`, `content_id`, `admin_name`.

#### Validation Rules
- Search **never** matches against or returns journal `title`/`body` (content is not indexed for admin search).
- Results are role-filtered: Moderators see Reports/Users-in-moderation context; Admin entity types appear only for Super Admin.
- Queries are index-backed and paginated; minimum query length enforced to protect performance.

---

## 4. Role-Based Access Matrix

Three operator roles. The portal hides controls a role cannot use; the API enforces the same rules server-side (defense in depth).

### 4.1 Role Definitions

| Role | Description |
|------|-------------|
| **Super Admin** | Full access. Manages admins/roles, platform settings, destructive and irreversible actions, and audit-log export. |
| **Admin** | User management, spaces, analytics, AI/storage/journal monitoring, notifications, and moderation. No admin/role management, no settings, no irreversible purges. |
| **Moderator** | Reports & moderation and read-only monitoring (Dashboard, System Health view, Global Search within moderation scope). No user lifecycle beyond enforcement actions routed through a moderation case. |

### 4.2 Capability Matrix

| Capability | Super Admin | Admin | Moderator |
|---|:---:|:---:|:---:|
| View Dashboard / Overview | ✅ | ✅ | ✅ |
| View System Health | ✅ | ✅ | ✅ (view) |
| Global Search | ✅ | ✅ | ✅ (scoped) |
| View Users / User Profile / Journey | ✅ | ✅ | ◐ (via case) |
| Suspend / Reactivate User | ✅ | ✅ | ✅ (via moderation case) |
| Ban User | ✅ | ✅ | ⛔ |
| Delete User (soft) | ✅ | ⛔ (confirm by SA) | ⛔ |
| Reset User Password | ✅ | ✅ | ⛔ |
| Export User Data | ✅ | ⛔ | ⛔ |
| Impersonate (read-only) | ✅ | ⛔ | ⛔ |
| Space Management (suspend/archive/restore) | ✅ | ✅ | ⛔ |
| Remove Space Member | ✅ | ✅ | ⛔ |
| Journal Monitoring (metadata) | ✅ | ✅ | ⛔ |
| AI Monitoring | ✅ | ✅ | ⛔ |
| Pause / Resume AI | ✅ | ⛔ | ⛔ |
| Storage Management (view) | ✅ | ✅ | ⛔ |
| Purge orphaned storage | ✅ | ⛔ | ⛔ |
| Reports & Moderation queue | ✅ | ✅ | ✅ |
| **View reported content (open case)** | ✅ | ✅ | ✅ |
| Remove Content / Dismiss / Warn | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ | ⛔ |
| Notifications: send to user | ✅ | ✅ | ⛔ |
| Notifications: broadcast | ✅ | ✅ | ⛔ |
| Audit Logs: view | ✅ | ✅ | ⛔ |
| Audit Logs: export | ✅ | ⛔ | ⛔ |
| Admin Management (roles) | ✅ | ⛔ | ⛔ |
| Platform Settings | ✅ | ⛔ | ⛔ |

> Legend: ✅ allowed · ⛔ denied · ◐ partial/contextual. Moderators reach user data only through the moderation case that justifies it. Enforcement actions taken by a Moderator (suspend) are routed through, and audited against, the originating report.

---

## 5. Privacy & Security Guidelines

### 5.1 The Privacy Guarantee (non-negotiable)

1. **Journal content is private by default.** Entry `title`/`body`, comment text, and attachment previews are **never** returned by monitoring, analytics, search, user, or space endpoints.
2. **The single exception** is a journal entry or comment that has been **reported by a user or flagged by an automated rule**, and only while the corresponding moderation case is **open** ([§3.9](#39-reports--moderation)).
3. **Every content view is audited** (`moderation.content_viewed`) with admin, resource, timestamp, and IP.
4. **Content is not indexed** for admin search; you cannot search platform data by entry text.
5. **Aggregates are safe.** Counts, rates, mood distributions, and trends are always available because they expose no individual content.

### 5.2 Sensitive Data Handling

- `password_hash`, raw passwords, OAuth secrets (`google_id` is treated as sensitive), API keys, and service keys are **never** returned to the client, displayed, exported, or written to logs.
- Configuration secrets in Platform Settings are **write-only** (masked after entry).
- Password resets occur via emailed link/token only; the credential never transits the portal UI or logs.
- PII in exports is minimized and access-controlled (Super Admin); exports are audited.
- Soft-deleted users have PII minimized while the audit trail is retained.

### 5.3 Access & Transport Security

- **Authentication:** admin portal requires authenticated admin accounts; 2FA recommended/required per settings; short-lived access tokens with refresh.
- **Authorization:** enforced server-side on every endpoint via role middleware (the matrix in [§4](#4-role-based-access-matrix)); UI gating is convenience only.
- **Transport:** HTTPS/TLS for all traffic; CORS restricted to known admin origins.
- **Rate limiting & abuse protection** on auth and search endpoints; brute-force spikes surfaced in System Health.
- **Optional IP allowlist** for portal access (Platform Settings).
- **Session management:** revocable sessions; auto-expiry; forced re-auth for high-risk actions (delete, role change, settings).

### 5.4 Performance & Safety Constraints

- All lists/searches/filters are **paginated and index-backed**; minimum query length on free-text search.
- Aggregations are computed server-side; raw rows backing an aggregate are not shipped to the client.
- Destructive/irreversible actions require typed confirmation + the documented role.

---

## 6. Audit & Compliance Requirements

### 6.1 What Must Be Logged

Every **state-changing** admin action and every **content view** produces an immutable audit record. Minimum fields:

- **`admin_name`** (and `admin_id`, `admin_role` at time of action)
- **`action`** (machine code, e.g., `user.ban`, `report.dismiss`)
- **`resource`** (`resource_type` + `resource_id`)
- **`timestamp`** (UTC)
- **`ip_address`**
- `user_agent`, `reason`/note, `result` (success/denied/error), and `before`/`after` where applicable.

### 6.2 Coverage Checklist

| Event | Logged |
|---|:---:|
| User suspend / reactivate / ban / delete | ✅ |
| Password reset initiated | ✅ |
| User data export | ✅ |
| Impersonation start/end | ✅ |
| Space suspend / archive / restore / member removal | ✅ |
| Moderation: content viewed | ✅ |
| Moderation: remove content / dismiss / warn / escalate | ✅ |
| AI pause/resume, batch retry | ✅ |
| Storage purge | ✅ |
| Notification broadcast | ✅ |
| Admin create / role change / disable / remove | ✅ |
| Platform settings change (before/after) | ✅ |
| Failed/denied authorization attempts | ✅ |
| Audit-log export | ✅ |

### 6.3 Integrity & Retention

- **Append-only**: no UI/API path edits or deletes audit records; enforced at service/DB layer.
- **Retention**: audit logs retained per a configurable policy (default ≥ 12 months) defined in Platform Settings.
- **Tamper-evidence**: records are immutable; exports are signed/timestamped where feasible.
- **Reviewability**: saved filters/alerts on high-risk actions; periodic review by Super Admin.

---

## 7. Success Metrics & KPIs

### 7.1 Platform KPIs surfaced by the portal

- **Growth:** new signups (D/W/M), cumulative users, growth rate %, signups by `auth_method`.
- **Retention:** **Day 1 / Day 7 / Day 30** retention; weekly cohort retention; churn rate.
- **Engagement:** DAU / WAU / MAU; **stickiness (DAU/MAU)**; entries, comments, reactions per active user.
- **Spaces:** spaces created, type mix, avg members/space, invitation acceptance rate.
- **AI performance:** **AI success rate** (`done / (done + failed)`), p95 latency, adoption %, AI-enhanced entry share, cost per enhancement.
- **Storage:** usage %, growth rate, failed-upload rate.
- **Moderation:** open-report count, **median time-to-resolution**, dismissal vs. action ratio, repeat-offender rate.
- **System health:** API uptime %, error rate, AI queue depth.

### 7.2 KPIs for the Admin Portal itself

- **Operational responsiveness:** median moderation **time-to-first-action** and **time-to-resolution**.
- **Dashboard load time** (P95 < 2s) and metric freshness (live tiles < 60s stale).
- **Audit completeness:** 100% of state-changing actions produce a record (monitored).
- **Privacy adherence:** zero content exposures outside open moderation cases (alert on any violation attempt).
- **Search performance:** P95 search latency < 500ms.

---

## 8. Implementation Priorities

Phased delivery; each phase is independently shippable and testable.

### Phase 1 — Foundation & Safety (must-have)
1. Admin auth + **role middleware** (Super Admin / Admin / Moderator) — server-enforced.
2. New backend objects: `account_status`, admin/role model, **audit-log** table (append-only), **report** model.
3. **Audit logging** wired into every state-changing endpoint.
4. **User Management** (list, filters, search, lifecycle actions with reasons).
5. **Reports & Moderation** queue + case view (the gated content path) + enforcement.
6. **Dashboard** with core KPI tiles.

### Phase 2 — Visibility & Analytics
7. User Profile & User Journey.
8. Space Management.
9. Journal Monitoring (metadata, privacy-safe).
10. Analytics (growth, retention D1/D7/D30, engagement, funnel).
11. AI Monitoring; Storage Management.
12. System Health.

### Phase 3 — Operations & Governance
13. Admin Management (role grants, 2FA).
14. Platform Settings (toggles, limits, metric defs, retention).
15. Notifications (delivery metrics + broadcasts).
16. Global Search across entities.

### Phase 4 — Hardening
17. Audit export + saved alerts on high-risk actions.
18. IP allowlist, session revocation, forced re-auth on high-risk actions.
19. Performance passes (indexing, pagination, server-side aggregation), real-time refresh.
20. Privacy/security review: verify no content path exists outside moderation; pen-test admin endpoints.

---

## Appendix A — Glossary

- **Space** — container for journaling/social activity; types: personal, couple, family, friends, custom.
- **Entry** — a journal entry authored in a space; has mood, optional attachments, optional AI enhancement.
- **AI status** — `none` / `pending` / `done` / `failed` (background OpenRouter enhancement).
- **Active user** — definition configured in Platform Settings (default: ≥1 login or ≥1 entry in the window).
- **Open moderation case** — the only state in which reported content is viewable.
- **Soft delete** — account marked `Deleted`, PII minimized, audit trail retained.

## Appendix B — Cross-cutting field conventions

- Identifiers are UUIDs (`*_id`). Timestamps stored in **UTC**, displayed in configured timezone.
- All tables: paginated, sortable, index-backed; free-text search has a minimum length.
- All destructive actions: typed confirmation + documented role + audit record + reason.
- All enums match the platform model: `SpaceType`, `Mood`, `AIStatus`, `ReactionType`, `NotificationType`, `MemberRole`, `InvitationStatus`.
