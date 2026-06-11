import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { cn } from "../utils/cn";
import { ROLE_LABEL, hasRole } from "../utils/roles";
import type { UserRole } from "../types";

interface AdminNavItem {
  to: string;
  label: string;
  emoji: string;
  end?: boolean;
  minRole: UserRole;
}

const NAV: AdminNavItem[] = [
  { to: "/admin", label: "Overview", emoji: "📊", end: true, minRole: "moderator" },
  { to: "/admin/analytics", label: "Analytics", emoji: "📈", minRole: "admin" },
  { to: "/admin/users", label: "Users", emoji: "👥", minRole: "admin" },
  { to: "/admin/spaces", label: "Spaces", emoji: "🗂️", minRole: "moderator" },
  { to: "/admin/journal", label: "Journal", emoji: "📔", minRole: "admin" },
  { to: "/admin/reports", label: "Reports", emoji: "🚩", minRole: "moderator" },
  { to: "/admin/operations", label: "Operations", emoji: "🛠️", minRole: "admin" },
  { to: "/admin/audit", label: "Audit log", emoji: "📜", minRole: "admin" },
];

function AdminSidebar() {
  const user = useAuthStore((s) => s.user);
  const items = NAV.filter((i) => hasRole(user?.role, i.minRole));

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div>
        <span className="font-serif text-xl font-semibold text-brand-700 dark:text-brand-300">
          carpe diem
        </span>
        <span className="mt-0.5 block text-xs uppercase tracking-wide text-stone-400">
          Admin portal
        </span>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            end={i.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                isActive
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                  : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
              )
            }
          >
            <span aria-hidden="true">{i.emoji}</span>
            {i.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-2 border-t border-stone-100 pt-4 dark:border-stone-800">
        <div className="px-1 text-sm">
          <p className="font-medium text-stone-700 dark:text-stone-200">{user?.username}</p>
          <p className="text-xs text-stone-400">
            {user?.role ? ROLE_LABEL[user.role] : ""}
          </p>
        </div>
        <NavLink
          to="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
        >
          ← Back to app
        </NavLink>
      </div>
    </div>
  );
}

export function AdminLayout() {
  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 border-r border-stone-100 bg-white dark:border-stone-800 dark:bg-stone-900 lg:block">
        <AdminSidebar />
      </aside>

      {/* Mobile header */}
      <header className="flex items-center justify-between border-b border-stone-100 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900 lg:hidden">
        <span className="font-serif text-lg font-semibold text-brand-700 dark:text-brand-300">
          Admin
        </span>
        <NavLink to="/" className="text-sm text-stone-500">
          ← App
        </NavLink>
      </header>

      <main className="flex-1">
        {/* Mobile nav row */}
        <div className="border-b border-stone-100 bg-white px-2 py-2 dark:border-stone-800 dark:bg-stone-900 lg:hidden">
          <MobileAdminNav />
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function MobileAdminNav() {
  const user = useAuthStore((s) => s.user);
  const items = NAV.filter((i) => hasRole(user?.role, i.minRole));
  return (
    <nav className="flex gap-1 overflow-x-auto">
      {items.map((i) => (
        <NavLink
          key={i.to}
          to={i.to}
          end={i.end}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm",
              isActive
                ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                : "text-stone-500"
            )
          }
        >
          <span aria-hidden="true">{i.emoji}</span>
          {i.label}
        </NavLink>
      ))}
    </nav>
  );
}
