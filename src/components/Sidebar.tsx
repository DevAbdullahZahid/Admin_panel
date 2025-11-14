// src/components/Sidebar.tsx
import React, { useState } from 'react';
import { HomeIcon, UsersIcon, DollarSignIcon, BookOpenIcon } from './icons';
import { 
  Home, 
  Inbox, 
  MessageSquare, 
  Users, 
  Gift, 
  Settings,
  ChevronRight
} from 'lucide-react';
import { PortalUserRole } from '../types';

// Fixed Page type — you had a syntax error here!
type Page =
  | 'Dashboard'
  | 'Users Management'
  | 'Subscriptions'
  | 'Exercises Management'
  | 'Reading'
  | 'Writing'
  | 'Listening'
  | 'Speaking'
  | 'Promo Codes'
  | 'Promo Modules'
  | 'Contact Form Submissions'   // Fixed: was missing |
  | 'Inquiries';                  // Fixed: now valid

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  page: Page;
}

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  currentUserRole: PortalUserRole;
}

const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  currentUserRole,
}) => {
  const [isExercisesExpanded, setIsExercisesExpanded] = useState(false);
  const isExerciseActive = ['Reading', 'Writing', 'Listening', 'Speaking'].includes(activePage);

  // Base navigation — visible to all staff/admins
  const baseNavItems: NavItem[] = [
    { name: 'Dashboard', icon: Home, page: 'Dashboard' },
    { name: 'Users Management', icon: UsersIcon, page: 'Users Management' },
    { 
      name: 'Contact Form Submissions', 
      icon: Inbox, 
      page: 'Contact Form Submissions' 
    },
    { 
      name: 'Inquiries', 
      icon: MessageSquare, 
      page: 'Inquiries' 
    },
  ];

  // Admin-only items
  const adminOnlyNavItems: NavItem[] = [
    { name: 'Subscriptions', icon: DollarSignIcon, page: 'Subscriptions' },
    { name: 'Promo Codes', icon: Gift, page: 'Promo Codes' },
    { name: 'Promo Modules', icon: Gift, page: 'Promo Modules' },
  ];

  // Exercise modules (collapsible)
  const exerciseModules: NavItem[] = [
    { name: 'Reading', icon: BookOpenIcon, page: 'Reading' },
    { name: 'Writing', icon: BookOpenIcon, page: 'Writing' },
    { name: 'Listening', icon: BookOpenIcon, page: 'Listening' },
    { name: 'Speaking', icon: BookOpenIcon, page: 'Speaking' },
  ];

  // Determine which items to show
  const navItems = [
    ...baseNavItems,
    ...(currentUserRole === 'SuperAdmin' || currentUserRole === 'Admin'
      ? adminOnlyNavItems
      : []),
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen">
      {/* Logo / Title */}
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-2xl font-bold tracking-tight">IELTS Portal</h2>
        <p className="text-xs text-gray-400 mt-1">Admin Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Main Nav Items */}
        {navItems.map((item) => (
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

        {/* Exercises Management (Collapsible) */}
        {(currentUserRole === 'SuperAdmin' || currentUserRole === 'Admin' || currentUserRole === 'Editor') && (
          <>
            <button
              onClick={() => setIsExercisesExpanded(!isExercisesExpanded)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all font-medium
                ${isExercisesExpanded || isExerciseActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <div className="flex items-center gap-3">
                <BookOpenIcon className="w-5 h-5" />
                <span>Exercises Management</span>
              </div>
              <ChevronRight
                className={`w-4 h-4 transition-transform ${isExercisesExpanded ? 'rotate-90' : ''}`}
              />
            </button>

            {isExercisesExpanded && (
              <div className="pl-10 space-y-1 mt-1">
                {exerciseModules.map((module) => (
                  <button
                    key={module.page}
                    onClick={() => setActivePage(module.page)}
                    className={`w-full text-left px-4 py-2.5 rounded-md text-sm transition-all
                      ${activePage === module.page
                        ? 'bg-purple-600 text-white font-semibold'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                  >
                    {module.name} Module
                  </button>
                ))}
              </div>
            )}
          </>
        )}
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