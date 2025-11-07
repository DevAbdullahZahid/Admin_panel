// src/pages/ExercisesManagement.tsx (Module-Specific List View - FINAL)

import React, { useState, useEffect } from 'react';
// --- CHANGE: Import PortalUserRole ---
import { Exercise, ExerciseType, PortalUserRole } from '../types';
import { PlusIcon, TrashIcon } from '../components/icons';
import { sampleExercises } from '../data/sampleExercises';

// --- CONSTANTS ---
const EXERCISES_STORAGE_KEY = 'ielts_saved_exercises';

const getInitialExercises = (): Exercise[] => {
    const storedExercises = localStorage.getItem(EXERCISES_STORAGE_KEY);
    if (storedExercises) {
        return JSON.parse(storedExercises);
    }
    // Initialize with samples only if localStorage is empty
    localStorage.setItem(EXERCISES_STORAGE_KEY, JSON.stringify(sampleExercises));
    return sampleExercises;
};

// Define the component interface that now ACCEPTS the necessary props from App.tsx
interface ModuleListProps {
    moduleType: ExerciseType; // e.g., 'Reading', 'Writing'
    onEdit: (exercise: Exercise | null) => void; // Function to switch to the form page
    currentUserRole: PortalUserRole; // <-- Accept role
}

// NOTE: This component is now ONLY the list and handles NO FORM/MODAL logic.
const ExercisesManagement: React.FC<ModuleListProps> = ({ moduleType, onEdit, currentUserRole }) => {
  const [allExercises, setAllExercises] = useState<Exercise[]>(getInitialExercises);
  
  // --- (NEW) STATE FOR SEARCH QUERY ---
  const [searchQuery, setSearchQuery] = useState('');
  // ------------------------------------
  
  // This effect ensures we load the latest data when the component mounts or the module changes
  useEffect(() => {
    setAllExercises(getInitialExercises());
    setSearchQuery(''); // Also reset search query when module changes
  }, [moduleType]);

  // --- (MODIFIED) Filter exercises by module AND search query ---
  const filteredExercises = allExercises.filter(ex => 
    ex.exerciseType === moduleType &&
    ex.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // -----------------------------------------------------------

  const handleDeleteExercise = (exerciseId: string, title: string) => {
    // --- (UNCHANGED) Delete logic ---
    // --- CHANGE: Removed permission check for Editor ---
    // (Editors can now delete exercises)
    // -------------------------------------------

    if (window.confirm(`Are you sure you want to delete the exercise: "${title}"?`)) {
        const updatedList = allExercises.filter(ex => ex.id !== exerciseId);
        setAllExercises(updatedList); // Update local state for immediate re-render
        localStorage.setItem(EXERCISES_STORAGE_KEY, JSON.stringify(updatedList)); // Update storage
    }
  };


  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
            {/* Title changes based on the module selected in the sidebar */}
            <h1 className="text-3xl font-bold text-gray-800">{moduleType} Management</h1>
            <p className="text-gray-500 mt-1">List of all saved {moduleType} exercises.</p>
        </div>
        {/* --- Editors can now see this button --- */}
        {(currentUserRole === 'SuperAdmin' || currentUserRole === 'Admin' || currentUserRole === 'Editor') && (
            <button 
                // FIX: This calls the handler in App.tsx with null to switch view to ExerciseForm
                onClick={() => onEdit(null)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="mr-2 w-4 h-4" />
              Create New Exercise
            </button>
        )}
      </div>

      {/* --- (NEW) Search Filter Input --- */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by exercise title..."
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>
      {/* ------------------------------- */}

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tasks</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time (mins)</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredExercises.length > 0 ? filteredExercises.map(ex => (
              <tr key={ex.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ex.title}</td>
                <td className="px-6 py-4 whitespace-nowdrap text-sm text-gray-500">{ex.tasks.length}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ex.allowedTime}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button 
                      onClick={() => onEdit(ex)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                      View/Edit
                  </button>
                  {/* --- CHANGE: Allow Editors to delete --- */}
                  {/* The button is now always visible, and the handler allows deletion */}
                  <button
                      onClick={() => handleDeleteExercise(ex.id, ex.title)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700"
                  >
                      <TrashIcon className="w-3 h-3"/>
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gray-500">
                  {searchQuery ? 'No exercises found matching your search.' : `No ${moduleType} exercises found. Click 'Create New Exercise' to add one.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ExercisesManagement;