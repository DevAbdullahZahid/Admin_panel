// src/pages/ExercisesManagement.tsx - Task Count Fixed

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiService';
import { Exercise, ExerciseType, PortalUserRole } from '../types';
import { PlusIcon, TrashIcon } from '../components/icons';

interface ModuleListProps {
  moduleType: ExerciseType;
  onEdit: (exercise: Exercise | null) => void;
  currentUserRole: PortalUserRole;
}

const moduleTypeToId = (type: ExerciseType): number => {
  const map: Record<ExerciseType, number> = {
    Reading: 1,
    Writing: 2,
    Listening: 3,
    Speaking: 4,
  };
  return map[type];
};

// Extend Exercise type locally to include the count for display
interface ExerciseDisplay extends Exercise {
    taskCount: number;
}

const ExercisesManagement: React.FC<ModuleListProps> = ({ moduleType, onEdit, currentUserRole }) => {
  const [exercises, setExercises] = useState<ExerciseDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchExercises = async () => {
    try {
      setLoading(true);
      setError(null);

      const moduleId = moduleTypeToId(moduleType);
      
      const response = await apiFetch(`/exercises?module_id=${moduleId}`);

      const exerciseList = response?.data?.exercises || response?.exercises || [];

      if (!Array.isArray(exerciseList)) {
        setError('Received invalid data format for exercises.');
        setExercises([]);
        return;
      }

      // 🚨 FIX: Using Array.isArray for a safer check of task_ids length
      const normalized = exerciseList.map((ex: any) => ({
        ...ex,
        id: ex.exercise_id || ex.id,
        allowedTime: ex.allowed_time || ex.allowedTime,
        tasks: ex.tasks || [], 
        
        // Use a defensive check against task_ids to ensure it's an array
        taskCount: Array.isArray(ex.task_ids) ? ex.task_ids.length : 0,
        
        passage_id: ex.passage_id || null, 
        image_id: ex.image_id || null,
        recording_id: ex.recording_id || null,
      })) as ExerciseDisplay[];

      setExercises(normalized);
    } catch (err: any) {
      console.error('Fetch failed:', err);
      setError(err.message || 'Failed to load exercises');
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [moduleType]);

  const filteredExercises = exercises.filter(ex =>
    ex.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string | number) => {
    if (!confirm('Delete this exercise permanently?')) return;
    try {
      await apiFetch(`/exercises/${id}`, { method: 'DELETE' });
      setExercises(prev => prev.filter(ex => String(ex.id) !== String(id)));
      alert('Deleted successfully');
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleRefresh = () => fetchExercises();

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{moduleType} Management</h1>
          <p className="text-gray-500 mt-1">List of all saved {moduleType} exercises.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleRefresh} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            Refresh
          </button>
          {(currentUserRole === 'SuperAdmin' || currentUserRole === 'Admin' || currentUserRole === 'Editor') && (
            <button onClick={() => onEdit(null)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              <PlusIcon className="w-5 h-5 mr-2" />
              Create New Exercise
            </button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {loading && <div className="text-center py-12 text-gray-500">Loading...</div>}
      {error && <div className="bg-red-50 text-red-700 p-4 rounded mb-6">{error}</div>}

      {!loading && filteredExercises.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg text-gray-500">
          {searchQuery ? 'No matches found' : `No ${moduleType} exercises yet`}
        </div>
      )}

      {!loading && filteredExercises.length > 0 && (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredExercises.map((ex) => (
                <tr key={String(ex.id)} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{ex.title}</td>
                  {/* Rendering the taskCount property */}
                  <td className="px-6 py-4 text-gray-600">{ex.taskCount}</td> 
                  <td className="px-6 py-4 text-gray-600">{ex.allowedTime} mins</td>
                  <td className="px-6 py-4 text-right space-x-4">
                    <button onClick={() => onEdit(ex)} className="text-indigo-600 hover:text-indigo-800">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(ex.id)} className="text-red-600 p-1 rounded hover:bg-red-50">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default ExercisesManagement;