// src/App.tsx

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import ExercisesManagement from './pages/ExercisesManagement';
import ExerciseForm from './pages/ExerciseForm';
import UsersManagement from './pages/UsersManagement';
import LoginPage from './pages/LoginPage';
import EditorTaskView from './pages/EditorTaskView'; // Uncommented for user/editor view
import PromoCodes from './pages/PromoCodes';
import PromoModules from './pages/PromoModules';
import { useAuth } from './hooks/useAuth';
import { Exercise, ExerciseType, User, PortalUserRole } from './types';

type Page =
  | 'Dashboard'
  | 'Users Management'
  | 'Reading'
  | 'Writing'
  | 'Listening'
  | 'Speaking'
  | 'Promo Codes'
  | 'Promo Modules';

const LoggedInApp: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const handleEditExercise = (exercise: Exercise | null) => {
    setIsCreatingNew(exercise === null);
    setExerciseToEdit(exercise);
  };
  const handleCloseEdit = () => {
    setExerciseToEdit(null);
    setIsCreatingNew(false);
  };

  const renderExerciseContent = (moduleType: ExerciseType) => {
    if (exerciseToEdit !== null || isCreatingNew) {
      return <ExerciseForm
        exerciseToEdit={exerciseToEdit}
        moduleType={moduleType}
        onClose={handleCloseEdit}
        currentUserRole={currentUser.role}
      />;
    }
    return <ExercisesManagement
      moduleType={moduleType}
      onEdit={handleEditExercise}
      currentUserRole={currentUser.role}
    />;
  };

  const renderContent = () => {
    switch (activePage) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Users Management':
        return <UsersManagement
          currentUserRole={currentUser.role}
          currentUserId={currentUser.id}
        />;
      case 'Reading':
        return renderExerciseContent('Reading');
      case 'Writing':
        return renderExerciseContent('Writing');
      case 'Listening':
        return renderExerciseContent('Listening');
      case 'Speaking':
        return renderExerciseContent('Speaking');
      case 'Promo Codes':
        return <PromoCodes />;
      case 'Promo Modules':
        return <PromoModules />;
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
  return <EditorTaskView />;
};

export default App;