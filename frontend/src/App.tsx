import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./components/Register/Register";
import Login from "./components/login/Login";
import VerifyEmail from "./components/verify/VerifyEmail";
import AppShell from "./components/layout/AppShell";
import RequireAuth from "./components/auth/RequireAuth";
import RedirectIfAuth from "./components/auth/RedirectIfAuth";
import Dashboard from "./pages/Dashboard";
import YardOverview from "./pages/YardOverview";
import VehiclesTrailers from "./pages/VehiclesTrailers";
import GateActivity from "./pages/GateActivity";
import Tasks from "./pages/Tasks";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Settings from "./pages/Settings";

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
          <Route path="home" element={<Dashboard />} />
          <Route path="yard-overview" element={<YardOverview />} />
          <Route path="vehicles" element={<VehiclesTrailers />} />
          <Route path="gate-activity" element={<GateActivity />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
