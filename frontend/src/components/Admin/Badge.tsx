import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import type {
  AccountStatus,
  ReportSeverity,
  ReportStatus,
  UserRole,
} from "../../types";

type Tone = "gray" | "green" | "amber" | "red" | "purple" | "blue";

const TONE: Record<Tone, string> = {
  gray: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
  green: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  purple: "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        TONE[tone]
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONE: Record<AccountStatus, Tone> = {
  active: "green",
  inactive: "gray",
  suspended: "amber",
  banned: "red",
  deleted: "gray",
};
export const StatusBadge = ({ status }: { status: AccountStatus }) => (
  <Badge tone={STATUS_TONE[status]}>{status}</Badge>
);

const ROLE_TONE: Record<UserRole, Tone> = {
  user: "gray",
  moderator: "blue",
  admin: "purple",
  super_admin: "purple",
};
export const RoleBadge = ({ role }: { role: UserRole }) => (
  <Badge tone={ROLE_TONE[role]}>{role.replace("_", " ")}</Badge>
);

const REPORT_TONE: Record<ReportStatus, Tone> = {
  open: "red",
  under_review: "amber",
  action_taken: "green",
  dismissed: "gray",
};
export const ReportStatusBadge = ({ status }: { status: ReportStatus }) => (
  <Badge tone={REPORT_TONE[status]}>{status.replace("_", " ")}</Badge>
);

const SEVERITY_TONE: Record<ReportSeverity, Tone> = {
  low: "gray",
  medium: "blue",
  high: "amber",
  critical: "red",
};
export const SeverityBadge = ({ severity }: { severity: ReportSeverity }) => (
  <Badge tone={SEVERITY_TONE[severity]}>{severity}</Badge>
);
