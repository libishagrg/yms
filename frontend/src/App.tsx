import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./components/Register/Register";
import Login from "./components/login/Login";
import VerifyEmail from "./components/verify/VerifyEmail";
import AppShell from "./components/layout/AppShell";
import RequireAuth from "./components/auth/RequireAuth";
import RedirectIfAuth from "./components/auth/RedirectIfAuth";
import RequireRole from "./components/auth/RequireRole";
import Dashboard from "./pages/Dashboard";
import YardOverview from "./pages/YardOverview";
import VehiclesTrailers from "./pages/VehiclesTrailers";
import GateActivity from "./pages/GateActivity";
import Tasks from "./pages/Tasks";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import { routeAccessMap } from "./auth/rbac";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route element={<RedirectIfAuth />}>
        <Route path="/login" element={<Login />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route element={<RequireRole allowedRoles={routeAccessMap["/home"]} />}>
            <Route path="home" element={<Dashboard />} />
          </Route>
          <Route element={<RequireRole allowedRoles={routeAccessMap["/yard-overview"]} />}>
            <Route path="yard-overview" element={<YardOverview />} />
          </Route>
          <Route element={<RequireRole allowedRoles={routeAccessMap["/vehicles"]} />}>
            <Route path="vehicles" element={<VehiclesTrailers />} />
          </Route>
          <Route element={<RequireRole allowedRoles={routeAccessMap["/gate-activity"]} />}>
            <Route path="gate-activity" element={<GateActivity />} />
          </Route>
          <Route element={<RequireRole allowedRoles={routeAccessMap["/tasks"]} />}>
            <Route path="tasks" element={<Tasks />} />
          </Route>
          <Route element={<RequireRole allowedRoles={routeAccessMap["/reports"]} />}>
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route element={<RequireRole allowedRoles={routeAccessMap["/users"]} />}>
            <Route path="users" element={<Users />} />
          </Route>
          <Route element={<RequireRole allowedRoles={routeAccessMap["/settings"]} />}>
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
