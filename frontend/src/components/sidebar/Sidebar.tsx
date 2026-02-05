'use client';

import React, { useState } from "react";
import "./sidebar.css";

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  logo,
  menuSections,
  userProfile,
  onItemClick,
}) => {
  const [activeItem, setActiveItem] = useState<string>(
    menuSections[0]?.items[0]?.id || ""
  );

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
          <p className="user-name">Logout</p>
          <p className="user-role">{userProfile.role}</p>
        </div>
      </div>
    </aside>
  );
};
