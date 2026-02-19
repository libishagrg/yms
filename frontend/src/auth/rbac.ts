export const roleNames = [
  "Administrator",
  "Yard Manager",
  "Yard Jockey",
  "Gate Security",
  "View Only",
] as const;

export type RoleName = (typeof roleNames)[number];

export const appRoutePaths = [
  "/home",
  "/yard-overview",
  "/vehicles",
  "/gate-activity",
  "/tasks",
  "/reports",
  "/users",
  "/settings",
] as const;

export type AppRoutePath = (typeof appRoutePaths)[number];

export const menuItemIds = [
  "home",
  "yard",
  "vehicles",
  "gate",
  "tasks",
  "reports",
  "users",
  "settings",
] as const;

export type MenuItemId = (typeof menuItemIds)[number];

const allRoles: readonly RoleName[] = roleNames;

export const routeAccessMap: Record<AppRoutePath, readonly RoleName[]> = {
  "/home": allRoles,
  "/yard-overview": ["Administrator", "Yard Manager", "Yard Jockey", "View Only"],
  "/vehicles": allRoles,
  "/gate-activity": ["Administrator", "Yard Manager", "Gate Security", "View Only"],
  "/tasks": ["Administrator", "Yard Manager", "Yard Jockey", "View Only"],
  "/reports": ["Administrator", "Yard Manager", "View Only"],
  "/users": ["Administrator"],
  "/settings": ["Administrator"],
};

export const menuItemAccessMap: Record<MenuItemId, readonly RoleName[]> = {
  home: allRoles,
  yard: ["Administrator", "Yard Manager", "Yard Jockey", "View Only"],
  vehicles: allRoles,
  gate: ["Administrator", "Yard Manager", "Gate Security", "View Only"],
  tasks: ["Administrator", "Yard Manager", "Yard Jockey", "View Only"],
  reports: ["Administrator", "Yard Manager", "View Only"],
  users: ["Administrator"],
  settings: ["Administrator"],
};

export const defaultRouteByRole: Record<RoleName, AppRoutePath> = {
  Administrator: "/home",
  "Yard Manager": "/home",
  "Yard Jockey": "/home",
  "Gate Security": "/home",
  "View Only": "/home",
};

export function isAppRoutePath(pathname: string): pathname is AppRoutePath {
  return appRoutePaths.includes(pathname as AppRoutePath);
}

export function normalizeRoleName(roleName?: string | null): RoleName | null {
  const value = (roleName ?? "").trim();
  return (roleNames.find((role) => role === value) ?? null) as RoleName | null;
}

export function getDefaultRouteForRole(roleName?: string | null): AppRoutePath {
  const role = normalizeRoleName(roleName);
  return role ? defaultRouteByRole[role] : "/home";
}

export function canRoleAccessRoute(roleName: string | null | undefined, route: AppRoutePath): boolean {
  const role = normalizeRoleName(roleName);
  if (!role) {
    return route === "/home";
  }
  return routeAccessMap[route].includes(role);
}

export function canRoleAccessMenuItem(roleName: string | null | undefined, itemId: MenuItemId): boolean {
  const role = normalizeRoleName(roleName);
  if (!role) {
    return itemId === "home";
  }
  return menuItemAccessMap[itemId].includes(role);
}
