'use client';

import React, { useEffect, useState } from "react";
import "./sidebar.css";

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface UserProfile {
  initials: string;
  name: string;
  role: string;
}

interface SidebarProps {
  logo: string;
  menuSections: MenuSection[];
  userProfile: UserProfile;
  onItemClick?: (itemId: string) => void;
  onLogout?: () => void;
  activeItemId?: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  logo,
  menuSections,
  userProfile,
  onItemClick,
  onLogout,
  activeItemId,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [activeItem, setActiveItem] = useState<string>(
    activeItemId || menuSections[0]?.items[0]?.id || ""
  );

  useEffect(() => {
    if (activeItemId) {
      setActiveItem(activeItemId);
    }
  }, [activeItemId]);

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
    onItemClick?.(itemId);
  };

  return (
    <aside className={`sidebar ${isMobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-logo">
        <h1>{logo}</h1>
        <button
          type="button"
          className="sidebar-close-mobile"
          aria-label="Close navigation"
          onClick={onCloseMobile}
        >
          x
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuSections.map((section) => (
          <div key={section.title} className="menu-section">
            <h2 className="menu-section-title">{section.title}</h2>
            <ul className="menu-items">
              {section.items.map((item) => (
                <li key={item.id}>
                  <button
                    className={`menu-item ${
                      activeItem === item.id ? "active" : ""
                    }`}
                    onClick={() => handleItemClick(item.id)}
                  >
                    <span className="menu-icon">{item.icon}</span>
                    <span className="menu-label">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-user-avatar">{userProfile.initials}</div>
        <div className="sidebar-user-info">
          <p className="sidebar-user-name">{userProfile.name}</p>
          <p className="sidebar-user-role">{userProfile.role}</p>
        </div>
      </div>
      <button className="sidebar-logout" onClick={onLogout} type="button">
        Logout
      </button>
    </aside>
  );
};
