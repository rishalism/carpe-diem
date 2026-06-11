import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useConfigStore } from "./store/configStore";
import { ProtectedRoute, PublicOnlyRoute } from "./routes/ProtectedRoute";
import { AdminRoute } from "./routes/AdminRoute";
import { AuthLayout } from "./layouts/AuthLayout";
import { AppLayout } from "./layouts/AppLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminUserDetail } from "./pages/admin/AdminUserDetail";
import { AdminReports } from "./pages/admin/AdminReports";
import { AdminReportCase } from "./pages/admin/AdminReportCase";
import { AdminAudit } from "./pages/admin/AdminAudit";
import { AdminAnalytics } from "./pages/admin/AdminAnalytics";
import { AdminJournal } from "./pages/admin/AdminJournal";
import { AdminSpaces } from "./pages/admin/AdminSpaces";
import { AdminSpaceDetail } from "./pages/admin/AdminSpaceDetail";
import { AdminOperations } from "./pages/admin/AdminOperations";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Dashboard } from "./pages/Dashboard";
import { SpaceDetail } from "./pages/SpaceDetail";
import { EntryEditor } from "./pages/EntryEditor";
import { Profile } from "./pages/Profile";
import { AcceptInvite } from "./pages/AcceptInvite";
import { Search } from "./pages/Search";
import { Settings } from "./pages/Settings";
import { ResetPassword } from "./pages/ResetPassword";

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const fetchConfig = useConfigStore((s) => s.fetch);

  useEffect(() => {
    bootstrap();
    fetchConfig();
  }, [bootstrap, fetchConfig]);

  return (
    <Routes>
      {/* Public auth pages */}
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>
      </Route>

      {/* Authenticated app */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/spaces/:spaceId" element={<SpaceDetail />} />
          <Route path="/spaces/:spaceId/entries/new" element={<EntryEditor />} />
          <Route path="/spaces/:spaceId/entries/:entryId" element={<EntryEditor />} />
          <Route path="/invite/:token" element={<AcceptInvite />} />
          <Route path="/search" element={<Search />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Admin portal (staff only) */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:userId" element={<AdminUserDetail />} />
          <Route path="spaces" element={<AdminSpaces />} />
          <Route path="spaces/:spaceId" element={<AdminSpaceDetail />} />
          <Route path="journal" element={<AdminJournal />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="reports/:reportId" element={<AdminReportCase />} />
          <Route path="operations" element={<AdminOperations />} />
          <Route path="audit" element={<AdminAudit />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
