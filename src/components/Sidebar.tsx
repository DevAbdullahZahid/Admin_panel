// src/components/Sidebar.tsx
import React, { useState } from 'react';
import { HomeIcon, UsersIcon, DollarSignIcon, BookOpenIcon } from './icons';
import { Gift, Settings } from 'lucide-react';
import { PortalUserRole } from '../types';

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
  | 'Promo Modules';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  currentUserRole: PortalUserRole;
}

const baseNavItems = [
  { name: 'Dashboard', icon: HomeIcon, page: 'Dashboard' as Page },
];

const adminOnlyNavItems = [
  { name: 'Subscriptions', icon: DollarSignIcon, page: 'Subscriptions' as Page },
];

const staffNavItems = [
  { name: 'Users Management', icon: UsersIcon, page: 'Users Management' as Page },
];

const exerciseModules = [
  { name: 'Reading', page: 'Reading' as Page },
  { name: 'Writing', page: 'Writing' as Page },
  { name: 'Listening', page: 'Listening' as Page },
  { name: 'Speaking', page: 'Speaking' as Page },
];

const promoNavItems = [
  { name: 'Promo Codes', icon: Gift, page: 'Promo Codes' as Page },
  { name: 'Promo Modules', icon: Settings, page: 'Promo Modules' as Page },
];

const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  currentUserRole,
}) => {
  const [isExercisesExpanded, setIsExercisesExpanded] = useState(false);
  const isExerciseActive = exerciseModules.some((module) => module.page === activePage);

  const availableNavItems = [
    ...baseNavItems,
    ...(currentUserRole === 'SuperAdmin' || currentUserRole === 'Admin' || currentUserRole === 'Editor'
      ? staffNavItems
      : []),
    ...(currentUserRole === 'SuperAdmin' || currentUserRole === 'Admin'
      ? adminOnlyNavItems
      : []),
    ...(currentUserRole === 'SuperAdmin' || currentUserRole === 'Admin'
      ? promoNavItems
      : []),
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold">IELTS Portal</h2>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {availableNavItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setActivePage(item.page)}
            className={`flex items-center w-full px-4 py-2 rounded-md transition ${
              activePage === item.page ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </button>
        ))}
        {(currentUserRole === 'SuperAdmin' || currentUserRole === 'Admin' || currentUserRole === 'Editor') && (
          <>
            <button
              onClick={() => setIsExercisesExpanded(!isExercisesExpanded)}
              className={`flex items-center w-full px-4 py-2 rounded-md transition ${
                isExerciseActive || isExercisesExpanded ? 'bg-gray-100 text-gray-800' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <BookOpenIcon className={`w-5 h-5 mr-3 ${isExerciseActive ? 'text-blue-600' : ''}`} />
              Exercises Management
              <svg
                className={`w-4 h-4 ml-auto transform transition-transform ${isExercisesExpanded ? 'rotate-90' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            {isExercisesExpanded && (
              <div className="pl-8 space-y-1 mt-1">
                {exerciseModules.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setActivePage(item.page)}
                    className={`w-full flex items-center px-4 py-2 text-xs font-medium rounded-md transition-colors text-left ${
                      activePage === item.page ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {item.name} Module
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;