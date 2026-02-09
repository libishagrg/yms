import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "../sidebar/Sidebar";
import {
  IconChart,
  IconClipboard,
  IconGate,
  IconGrid,
  IconMapFold,
  IconSettings,
  IconSwap,
  IconUsers,
} from "../sidebar/icons";
import "./AppShell.css";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../lib/api";

const menuSections = [
  {
    title: "Overview",
    items: [
      { id: "home", label: "Dashboard", icon: <IconGrid /> },
      { id: "yard", label: "Yard Overview", icon: <IconMapFold /> },
    ],
  },
  {
    title: "Operations",
    items: [
      { id: "vehicles", label: "Vehicles / Trailers", icon: <IconSwap /> },
      { id: "gate", label: "Gate Activity", icon: <IconGate /> },
      { id: "tasks", label: "Tasks", icon: <IconClipboard /> },
    ],
  },
  {
    title: "Analytics",
    items: [{ id: "reports", label: "Reports", icon: <IconChart /> }],
  },
  {
    title: "Admin",
    items: [
      { id: "users", label: "Users", icon: <IconUsers /> },
      { id: "settings", label: "Settings", icon: <IconSettings /> },
    ],
  },
];

const routeByItemId: Record<string, string> = {
  home: "/home",
  yard: "/yard-overview",
  vehicles: "/vehicles",
  gate: "/gate-activity",
  tasks: "/tasks",
  reports: "/reports",
  users: "/users",
  settings: "/settings",
};

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setGuest } = useAuth();

  const handleSidebarItemClick = (itemId: string) => {
    const target = routeByItemId[itemId];
    if (target) {
      navigate(target);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } finally {
      setGuest();
      navigate("/login", { replace: true });
    }
  };

  const itemByRoute = Object.fromEntries(
    Object.entries(routeByItemId).map(([key, value]) => [value, key]),
  );
  const activeItemId = itemByRoute[location.pathname] ?? "home";
  const userName = user?.username || user?.email || "User";
  const userInitials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const userProfile = {
    initials: userInitials || "U",
    name: userName,
    role: user?.roleName || "Member",
  };

  return (
    <div className="app-shell">
      <Sidebar
        logo="Ytrac"
        menuSections={menuSections}
        userProfile={userProfile}
        onItemClick={handleSidebarItemClick}
        onLogout={handleLogout}
        activeItemId={activeItemId}
      />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
