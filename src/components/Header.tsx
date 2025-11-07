import React from 'react';
import { LogoutIcon } from './icons';
import { useAuth } from '../hooks/useAuth';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();

  return (
    <header className="flex items-center justify-between h-20 px-6 bg-white border-b border-gray-200">
      <div className="flex items-center">
        {/* Placeholder Icon */}
        <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
      </div>
      <div className="flex items-center">
        <span className="mr-4 font-semibold text-gray-700">{currentUser?.name || 'Admin User'}</span>
        <img
          className="w-10 h-10 rounded-full object-cover"
          src="https://picsum.photos/100"
          alt="User avatar"
        />
        <button 
          onClick={logout}
          className="ml-6 flex items-center text-sm font-medium text-gray-500 hover:text-red-500 transition-colors">
          <LogoutIcon className="w-5 h-5 mr-1" />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
