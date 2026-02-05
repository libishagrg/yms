import { Outlet, useNavigate } from "react-router-dom";
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

const userProfile = {
  initials: "JD",
  name: "Logout",
  role: "Yard Manager",
};

const routeByItemId: Record<string, string> = {
  home: "/home",
};

export default function AppShell() {
  const navigate = useNavigate();

  const handleSidebarItemClick = (itemId: string) => {
    const target = routeByItemId[itemId];
    if (target) {
      navigate(target);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        logo="Ytrac"
        menuSections={menuSections}
        userProfile={userProfile}
        onItemClick={handleSidebarItemClick}
      />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
