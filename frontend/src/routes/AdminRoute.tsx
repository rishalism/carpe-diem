import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { FullPageSpinner } from "../components/Common/Spinner";
import { isStaff } from "../utils/roles";

/** Gate the admin portal: authenticated AND a staff role (moderator+). */
export function AdminRoute() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status === "idle" || status === "loading") {
    return <FullPageSpinner />;
  }
  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }
  if (!isStaff(user?.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
