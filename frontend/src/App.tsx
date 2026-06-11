import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useConfigStore } from "./store/configStore";
import { ProtectedRoute, PublicOnlyRoute } from "./routes/ProtectedRoute";
import { AuthLayout } from "./layouts/AuthLayout";
import { AppLayout } from "./layouts/AppLayout";
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
