import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "../sidebar/Sidebar";
import "./AppShell.css";

const menuSections = [
  {
    title: "Main",
    items: [
      { id: "home", label: "Home", icon: "🏠" },
      { id: "analytics", label: "Analytics", icon: "📊" },
    ],
  },
  {
    title: "Management",
    items: [
      { id: "orders", label: "Orders", icon: "🧾" },
      { id: "inventory", label: "Inventory", icon: "📦" },
    ],
  },
];

const userProfile = {
  initials: "JD",
  name: "Logout",
  role: "Manager",
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
