// src/App.tsx

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import ModulesManagement from './pages/ModulesManagement';
import UsersManagement from './pages/UsersManagement';
import LoginPage from './pages/LoginPage'; // Uncommented for user/editor view
import PromoCodes from './pages/PromoCodes';
import PromoModules from './pages/PromoModules';
import Inquiries from './pages/Inquiries';
import { useAuth } from './hooks/useAuth';
import { User } from './types';
import ContactFormSubmissions from './pages/ContactFormSubmissions';

type Page =
  | 'Dashboard'
  | 'Users Management'
  | 'Exercises Management'
  | 'Promo Codes'
  | 'Contact Form Submissions'
  | 'Inquiries'
  | 'Promo Modules';

const LoggedInApp: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [activePage, setActivePage] = useState<Page>('Dashboard');

  const renderContent = () => {
  switch (activePage) {
    case 'Dashboard':
      return <Dashboard />;
    case 'Users Management':
      return <UsersManagement
        currentUserRole={currentUser.role}
        currentUserId={currentUser.id}
      />;
    case 'Exercises Management':
      return <ModulesManagement currentUserRole={currentUser.role} />;
    case 'Promo Codes':
      return <PromoCodes />;
    case 'Promo Modules':
      return <PromoModules />;
    case 'Inquiries':                     // <-- ADD THIS
      return <Inquiries />; 
    case 'Contact Form Submissions':
        return <ContactFormSubmissions />;             
    default:
      return <Dashboard />;
  }
};

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        currentUserRole={currentUser.role}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold">Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  if (['SuperAdmin', 'Admin', 'Editor'].includes(currentUser.role)) {
    return <LoggedInApp currentUser={currentUser} />;
  }

  // Fallback for other roles (e.g., 'User') – show EditorTaskView
  return <LoginPage />;
};

export default App;