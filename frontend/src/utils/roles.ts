import type { UserRole } from "../types";

export const ROLE_RANK: Record<UserRole, number> = {
  user: 0,
  moderator: 1,
  admin: 2,
  super_admin: 3,
};

export const ROLE_LABEL: Record<UserRole, string> = {
  user: "User",
  moderator: "Moderator",
  admin: "Admin",
  super_admin: "Super Admin",
};

/** True when `role` ranks at least as high as `min`. */
export function hasRole(role: UserRole | undefined | null, min: UserRole): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

export const isStaff = (role?: UserRole | null) => hasRole(role, "moderator");
