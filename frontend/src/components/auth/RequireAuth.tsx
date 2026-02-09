import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <div className="auth-loading">Checking session...</div>;
  }

  if (status === "guest") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
