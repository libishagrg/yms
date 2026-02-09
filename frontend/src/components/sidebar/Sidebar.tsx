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
}

export const Sidebar: React.FC<SidebarProps> = ({
  logo,
  menuSections,
  userProfile,
  onItemClick,
  onLogout,
  activeItemId,
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
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>{logo}</h1>
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
        <div className="user-avatar">{userProfile.initials}</div>
        <div className="user-info">
          <p className="user-name">{userProfile.name}</p>
          <p className="user-role">{userProfile.role}</p>
        </div>
      </div>
      <button className="sidebar-logout" onClick={onLogout} type="button">
        Logout
      </button>
    </aside>
  );
};
