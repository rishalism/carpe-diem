import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useUIStore } from "../store/uiStore";
import { useNotificationStore } from "../store/notificationStore";
import { Avatar } from "../components/Common/Avatar";
import { NotificationBell } from "../components/Common/NotificationBell";
import { cn } from "../utils/cn";
import { isStaff } from "../utils/roles";

const navItems = [
  { to: "/", label: "Dashboard", emoji: "🏠", end: true },
  { to: "/search", label: "Search", emoji: "🔍", end: false },
  { to: "/profile", label: "Profile", emoji: "👤", end: false },
  { to: "/settings", label: "Settings", emoji: "⚙️", end: false },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              isActive
                ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
            )
          }
        >
          <span aria-hidden="true">{item.emoji}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { darkMode, toggleDark } = useUIStore();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between px-2 py-3">
        <span className="font-serif text-xl font-semibold text-brand-700 dark:text-brand-300">
          carpe diem
        </span>
        <NotificationBell />
      </div>
      <div className="mt-4 flex-1">
        <NavLinks onNavigate={onNavigate} />
        {isStaff(user?.role) && (
          <NavLink
            to="/admin"
            onClick={onNavigate}
            className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            <span aria-hidden="true">🛡️</span>
            Admin portal
          </NavLink>
        )}
      </div>
      <div className="space-y-2 border-t border-stone-100 pt-4 dark:border-stone-800">
        <button
          onClick={toggleDark}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          <span aria-hidden="true">{darkMode ? "☀️" : "🌙"}</span>
          {darkMode ? "Light mode" : "Dark mode"}
        </button>
        {user && (
          <div className="flex items-center gap-3 rounded-xl px-3 py-2">
            <Avatar name={user.username} src={user.avatar_url} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.username}</p>
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="text-xs text-stone-400 hover:text-red-500"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AppLayout() {
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();
  const fetchNotifications = useNotificationStore((s) => s.fetch);

  // Full-screen, distraction-free editor: hide the bottom tab bar so the sticky
  // save bar owns the bottom of the screen.
  const hideTabs = /\/entries\//.test(location.pathname);

  useEffect(() => {
    fetchNotifications();
    const id = window.setInterval(fetchNotifications, 45000);
    return () => window.clearInterval(id);
  }, [fetchNotifications]);

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-stone-100 bg-white dark:border-stone-800 dark:bg-stone-900 lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-stone-100 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900 lg:hidden">
        <span className="font-serif text-lg font-semibold text-brand-700 dark:text-brand-300">
          carpe diem
        </span>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
            className="tap-target flex items-center justify-center rounded-lg p-2 text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawer && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/40 lg:hidden"
          onClick={() => setDrawer(false)}
        >
          <div
            className="h-full w-64 bg-white dark:bg-stone-900"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 pb-24 sm:px-6 sm:py-10 lg:pb-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tab bar — thumb-reachable primary nav (desktop uses the sidebar) */}
      {!hideTabs && (
        <nav
          className="fixed inset-x-0 bottom-0 z-30 flex border-t border-stone-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/95 lg:hidden"
          aria-label="Primary"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs",
                  isActive
                    ? "text-brand-700 dark:text-brand-200"
                    : "text-stone-500 dark:text-stone-400"
                )
              }
            >
              <span aria-hidden="true" className="text-lg">
                {item.emoji}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
