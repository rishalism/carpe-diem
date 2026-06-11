import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { FullPageSpinner } from "../components/Common/Spinner";

export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status);

  if (status === "idle" || status === "loading") {
    return <FullPageSpinner />;
  }
  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const status = useAuthStore((s) => s.status);
  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
