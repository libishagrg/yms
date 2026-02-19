import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getDefaultRouteForRole, normalizeRoleName, type RoleName } from "../../auth/rbac";
import { useAuth } from "../../contexts/AuthContext";

type RequireRoleProps = {
  allowedRoles: readonly RoleName[];
};

export default function RequireRole({ allowedRoles }: RequireRoleProps) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <div className="auth-loading">Checking session...</div>;
  }

  if (status === "guest") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const role = normalizeRoleName(user?.roleName);
  const isAllowed = role ? allowedRoles.includes(role) : location.pathname === "/home";

  if (!isAllowed) {
    return <Navigate to={getDefaultRouteForRole(user?.roleName)} replace />;
  }

  return <Outlet />;
}
