// src/components/Sidebar.tsx
import React from 'react';
import { UsersIcon, BookOpenIcon } from './icons';
import {
  Home,
  Inbox,
  MessageSquare,
  Gift,
  Settings,
} from 'lucide-react';
import { PortalUserRole } from '../types';

// Fixed Page type
type Page =
  | 'Dashboard'
  | 'Users Management'
  | 'Exercises Management'
  | 'Promo Codes'
  | 'Promo Modules'
  | 'Contact Form Submissions'
  | 'Inquiries';

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  page: Page;
  roles?: PortalUserRole[];
}

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  currentUserRole: PortalUserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, currentUserRole }) => {
  const navItems: NavItem[] = [
    { name: 'Dashboard', icon: Home, page: 'Dashboard' },
    { name: 'Users Management', icon: UsersIcon, page: 'Users Management', roles: ['SuperAdmin', 'Admin', 'Editor'] },
    { name: 'Exercises Management', icon: BookOpenIcon, page: 'Exercises Management', roles: ['SuperAdmin', 'Admin', 'Editor'] },
    { name: 'Contact Form Submissions', icon: Inbox, page: 'Contact Form Submissions', roles: ['SuperAdmin', 'Admin', 'Editor'] },
    { name: 'Inquiries', icon: MessageSquare, page: 'Inquiries', roles: ['SuperAdmin', 'Admin', 'Editor'] },
    { name: 'Promo Codes', icon: Gift, page: 'Promo Codes', roles: ['SuperAdmin', 'Admin'] },
    { name: 'Promo Modules', icon: Gift, page: 'Promo Modules', roles: ['SuperAdmin', 'Admin'] },
  ];

  const visibleNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(currentUserRole),
  );

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen">
      {/* Logo / Title */}
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-2xl font-bold tracking-tight">IELTS Portal</h2>
        <p className="text-xs text-gray-400 mt-1">Admin Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => (
          <button
            key={item.page}
            onClick={() => setActivePage(item.page)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 font-medium
              ${activePage === item.page
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 text-sm">
          <Settings className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;