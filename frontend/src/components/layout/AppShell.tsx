import { useEffect, useMemo, type ReactNode } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  canRoleAccessMenuItem,
  canRoleAccessRoute,
  getDefaultRouteForRole,
  isAppRoutePath,
  type AppRoutePath,
  type MenuItemId,
} from "../../auth/rbac";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../lib/api";
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

type MenuItem = {
  id: MenuItemId;
  label: string;
  icon: ReactNode;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

const menuSections: MenuSection[] = [
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

const routeByItemId: Record<MenuItemId, AppRoutePath> = {
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
  const roleName = user?.roleName;
  const isKnownAppRoute = isAppRoutePath(location.pathname);
  const isCurrentRouteAllowed = isKnownAppRoute
    ? canRoleAccessRoute(roleName, location.pathname as AppRoutePath)
    : true;

  const visibleMenuSections = useMemo(
    () =>
      menuSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => canRoleAccessMenuItem(roleName, item.id)),
        }))
        .filter((section) => section.items.length > 0),
    [roleName],
  );

  const itemByRoute = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(routeByItemId).map(([itemId, route]) => [route, itemId]),
      ) as Partial<Record<AppRoutePath, MenuItemId>>,
    [],
  );

  const handleSidebarItemClick = (itemId: string) => {
    const menuItemId = itemId as MenuItemId;
    if (!canRoleAccessMenuItem(roleName, menuItemId)) return;

    const targetRoute = routeByItemId[menuItemId];
    if (!targetRoute || !canRoleAccessRoute(roleName, targetRoute)) return;

    navigate(targetRoute);
  };

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } finally {
      setGuest();
      navigate("/login", { replace: true });
    }
  };

  useEffect(() => {
    if (!isAppRoutePath(location.pathname)) return;
    if (canRoleAccessRoute(roleName, location.pathname)) return;

    const fallbackRoute = getDefaultRouteForRole(roleName);
    if (location.pathname !== fallbackRoute) {
      navigate(fallbackRoute, { replace: true });
    }
  }, [location.pathname, navigate, roleName]);

  if (isKnownAppRoute && !isCurrentRouteAllowed) {
    return null;
  }

  const firstVisibleItemId = visibleMenuSections[0]?.items[0]?.id ?? "home";
  const activeItemId = isAppRoutePath(location.pathname)
    ? (itemByRoute[location.pathname] ?? firstVisibleItemId)
    : firstVisibleItemId;
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
        menuSections={visibleMenuSections}
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
