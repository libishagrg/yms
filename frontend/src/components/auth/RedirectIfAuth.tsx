import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function RedirectIfAuth() {
  const { status } = useAuth();

  if (status === "loading") {
    return <div className="auth-loading">Checking session...</div>;
  }

  if (status === "authenticated") {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
