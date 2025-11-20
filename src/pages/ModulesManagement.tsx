import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PortalUserRole } from '../types';
import { apiFetch } from '../utils/apiService';
import ExerciseForm from './ExerciseForm';
import {
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  RefreshCcw,
  Loader2,
  Layers,
} from 'lucide-react';

interface ModuleRecord {
  module_id: number;
  type: string;
  description?: string;
  isActive?: boolean;
}

type CanonicalExerciseType = 'Reading' | 'Writing' | 'Listening' | 'Speaking';

const moduleIdToCanonicalType: Record<number, CanonicalExerciseType> = {
  1: 'Reading',
  2: 'Writing',
  3: 'Listening',
  4: 'Speaking',
};

const guessCanonicalType = (module?: ModuleRecord | null): CanonicalExerciseType | string => {
  if (!module) return 'Reading';
  if (moduleIdToCanonicalType[module.module_id]) {
    return moduleIdToCanonicalType[module.module_id];
  }

  const label = module.type?.trim().toLowerCase();
  if (label?.includes('reading')) return 'Reading';
  if (label?.includes('writing')) return 'Writing';
  if (label?.includes('listening')) return 'Listening';
  if (label?.includes('speaking')) return 'Speaking';

  return module.type || 'Reading';
};

interface ExerciseRecord {
  id: string;
  title: string;
  description?: string;
  allowed_time: number;
  module_id: number;
  passage_id?: number | null;
  image_id?: number | null;
  recording_id?: number | null;
  taskCount: number;
  tasks?: any[];
}

interface ModulesManagementProps {
  currentUserRole: PortalUserRole;
}

const normalizeModule = (raw: any): ModuleRecord | null => {
  const moduleId = raw?.module_id ?? raw?.id ?? raw?.moduleId;
  if (!moduleId) return null;
  return {
    module_id: Number(moduleId),
    type: raw?.type || raw?.name || 'Untitled Module',
    description: raw?.description || raw?.details || '',
    isActive: raw?.is_active ?? raw?.isActive ?? true,
  };
};

const deriveTaskCount = (raw: any): number => {
  if (typeof raw?.task_count === 'number') return raw.task_count;
  if (typeof raw?.tasks_count === 'number') return raw.tasks_count;
  if (typeof raw?.total_tasks === 'number') return raw.total_tasks;
  if (typeof raw?.tasks_total === 'number') return raw.tasks_total;
  if (Array.isArray(raw?.task_ids)) return raw.task_ids.length;
  if (Array.isArray(raw?.tasks)) return raw.tasks.length;
  return 0;
};

const normalizeExercise = (raw: any, fallbackModuleId: number): ExerciseRecord => {
  const taskCount = deriveTaskCount(raw);
  return {
    id: String(raw?.exercise_id ?? raw?.id ?? crypto.randomUUID()),
    title: raw?.title || 'Untitled Exercise',
    description: raw?.description || '',
    allowed_time: Number(raw?.allowed_time ?? raw?.allowedTime ?? 0),
    module_id: Number(raw?.module_id ?? fallbackModuleId),
    passage_id: raw?.passage_id ?? null,
    image_id: raw?.image_id ?? null,
    recording_id: raw?.recording_id ?? null,
    taskCount,
    tasks: raw?.tasks || [],
  };
};

const ModulesManagement: React.FC<ModulesManagementProps> = ({ currentUserRole }) => {
  const [modules, setModules] = useState<ModuleRecord[]>([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [modulesError, setModulesError] = useState<string | null>(null);

  const [selectedModule, setSelectedModule] = useState<ModuleRecord | null>(null);

  const [exercises, setExercises] = useState<ExerciseRecord[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const [exercisesError, setExercisesError] = useState<string | null>(null);

  const [exerciseToEdit, setExerciseToEdit] = useState<any>(null);
  const [showExerciseForm, setShowExerciseForm] = useState(false);

  const [isModuleFormOpen, setIsModuleFormOpen] = useState(false);
  const [moduleFormState, setModuleFormState] = useState({ type: '', description: '' });
  const [moduleBeingEdited, setModuleBeingEdited] = useState<ModuleRecord | null>(null);
  const [moduleFormSubmitting, setModuleFormSubmitting] = useState(false);
  const [moduleFormError, setModuleFormError] = useState<string | null>(null);

  const canManage = useMemo(
    () => ['SuperAdmin', 'Admin', 'Editor'].includes(currentUserRole),
    [currentUserRole],
  );

  const fetchModules = useCallback(async () => {
    setModulesLoading(true);
    setModulesError(null);
    try {
      const response = await apiFetch('/modules');
      const list = response?.data?.modules ?? response?.modules ?? response ?? [];
      const normalized = (Array.isArray(list) ? list : [list])
        .map(normalizeModule)
        .filter((module): module is ModuleRecord => Boolean(module));
      setModules(normalized);
    } catch (err: any) {
      console.error('Failed to load modules:', err);
      setModulesError(err.message || 'Failed to load modules');
      setModules([]);
    } finally {
      setModulesLoading(false);
    }
  }, []);

  const fetchExercises = useCallback(async (moduleId: number) => {
    setExercisesLoading(true);
    setExercisesError(null);
    try {
      const response = await apiFetch(`/exercises?module_id=${moduleId}`);
      const list = response?.data?.exercises ?? response?.exercises ?? [];
      const normalized = (Array.isArray(list) ? list : [list]).map((exercise) =>
        normalizeExercise(exercise, moduleId),
      );
      setExercises(normalized);
    } catch (err: any) {
      console.error('Failed to load exercises:', err);
      setExercisesError(err.message || 'Failed to load exercises');
      setExercises([]);
    } finally {
      setExercisesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const handleSelectModule = (module: ModuleRecord) => {
    setSelectedModule(module);
    fetchExercises(module.module_id);
  };

  const handleBackToModules = () => {
    setSelectedModule(null);
    setExercises([]);
    setExercisesError(null);
  };

  const openModuleForm = (module?: ModuleRecord) => {
    setModuleBeingEdited(module ?? null);
    setModuleFormState({
      type: module?.type || '',
      description: module?.description || '',
    });
    setModuleFormError(null);
    setIsModuleFormOpen(true);
  };

  const closeModuleForm = () => {
    setIsModuleFormOpen(false);
    setModuleBeingEdited(null);
    setModuleFormState({ type: '', description: '' });
  };

  const handleModuleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!moduleFormState.type.trim()) {
      setModuleFormError('Module name is required.');
      return;
    }

    setModuleFormSubmitting(true);
    setModuleFormError(null);
    try {
      const payload = {
        type: moduleFormState.type.trim(),
        description: moduleFormState.description?.trim() || null,
      };

      if (moduleBeingEdited) {
        await apiFetch(`/modules/${moduleBeingEdited.module_id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/modules', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      closeModuleForm();
      await fetchModules();
    } catch (err: any) {
      console.error('Failed to save module:', err);
      setModuleFormError(err.message || 'Failed to save module');
    } finally {
      setModuleFormSubmitting(false);
    }
  };

  const handleDeleteModule = async (module: ModuleRecord, event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (!canManage) return;
    if (!window.confirm(`Delete module "${module.type}"? This cannot be undone.`)) return;

    try {
      await apiFetch(`/modules/${module.module_id}`, { method: 'DELETE' });
      if (selectedModule?.module_id === module.module_id) {
        setSelectedModule(null);
        setExercises([]);
      }
      fetchModules();
    } catch (err: any) {
      console.error('Failed to delete module:', err);
      alert(err.message || 'Failed to delete module');
    }
  };

  const handleCreateExercise = () => {
    if (!selectedModule) return;
    setExerciseToEdit(null);
    setShowExerciseForm(true);
  };

  const handleEditExercise = (exercise: ExerciseRecord) => {
    if (!selectedModule) return;
    setExerciseToEdit(exercise);
    setShowExerciseForm(true);
  };

  const handleExerciseFormClose = () => {
    setShowExerciseForm(false);
    setExerciseToEdit(null);
    if (selectedModule) {
      fetchExercises(selectedModule.module_id);
    }
  };

  const handleDeleteExercise = async (exercise: ExerciseRecord) => {
    if (!window.confirm(`Delete exercise "${exercise.title}"?`)) return;
    try {
      await apiFetch(`/exercises/${exercise.id}`, { method: 'DELETE' });
      if (selectedModule) {
        fetchExercises(selectedModule.module_id);
      } else {
        setExercises((prev) => prev.filter((ex) => ex.id !== exercise.id));
      }
    } catch (err: any) {
      console.error('Failed to delete exercise:', err);
      alert(err.message || 'Failed to delete exercise');
    }
  };

  const selectedModuleType = useMemo(
    () => guessCanonicalType(selectedModule),
    [selectedModule],
  );

  if (showExerciseForm && selectedModule) {
    return (
      <div className="bg-gray-100 rounded-xl shadow-sm">
        <ExerciseForm
          exerciseToEdit={exerciseToEdit as any}
          moduleType={selectedModuleType}
          moduleId={selectedModule.module_id}
          onClose={handleExerciseFormClose}
          currentUserRole={currentUserRole}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-purple-600 font-semibold">Content</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">
            {selectedModule ? `${selectedModule.type} Exercises` : 'Modules & Exercises'}
          </h1>
          <p className="text-gray-500 mt-1">
            {selectedModule
              ? 'Create, update, or remove exercises for this module.'
              : 'Organize IELTS modules and manage their exercises from a single workspace.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {!selectedModule && canManage && (
            <button
              onClick={() => openModuleForm()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
            >
              <Plus className="w-4 h-4" />
              New Module
            </button>
          )}
          {selectedModule && (
            <>
              <button
                onClick={() => fetchExercises(selectedModule.module_id)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
              >
                <RefreshCcw className="w-4 h-4" />
                Refresh
              </button>
              {canManage && (
                <>
                  <button
                    onClick={() => openModuleForm(selectedModule)}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Module
                  </button>
                  <button
                    onClick={() => handleDeleteModule(selectedModule)}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Module
                  </button>
                </>
              )}
              {canManage && (
                <button
                  onClick={handleCreateExercise}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  New Exercise
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {selectedModule ? (
        <section className="space-y-6">
          <button
            onClick={handleBackToModules}
            className="inline-flex items-center gap-2 text-purple-600 font-medium hover:text-purple-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Modules
          </button>

          {exercisesError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {exercisesError}
            </div>
          )}

          <div className="bg-white rounded-xl shadow border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Exercises</h2>
              <span className="text-sm text-gray-500">
                {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
              </span>
            </div>

            {exercisesLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-500 gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading exercises...
              </div>
            ) : exercises.length === 0 ? (
              <div className="py-12 flex flex-col items-center text-gray-500 gap-3">
                <Layers className="w-10 h-10 text-gray-300" />
                <p>No exercises found for this module.</p>
                {canManage && (
                  <button
                    onClick={handleCreateExercise}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add Exercise
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Tasks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      {canManage && (
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {exercises.map((exercise) => (
                      <tr key={exercise.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{exercise.title}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {exercise.description || <span className="text-gray-400">No description</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{exercise.taskCount}</td>
                        <td className="px-6 py-4 text-gray-600">{exercise.allowed_time} mins</td>
                        {canManage && (
                          <td className="px-6 py-4 text-right space-x-3">
                            <button
                              onClick={() => handleEditExercise(exercise)}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteExercise(exercise)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          {modulesError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {modulesError}
            </div>
          )}

          <div className="bg-white rounded-xl shadow border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Modules</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {modules.length} {modules.length === 1 ? 'module' : 'modules'}
                </span>
                <button
                  onClick={fetchModules}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition text-sm"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            {modulesLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-500 gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading modules...
              </div>
            ) : modules.length === 0 ? (
              <div className="py-12 flex flex-col items-center text-gray-500 gap-3">
                <Layers className="w-10 h-10 text-gray-300" />
                <p>No modules found.</p>
                {canManage && (
                  <button
                    onClick={() => openModuleForm()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Create Module
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 p-6 md:grid-cols-2">
                {modules.map((module) => (
                  <div
                    key={module.module_id}
                    onClick={() => handleSelectModule(module)}
                    className="border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{module.type}</h3>
                        <p className="text-gray-500 mt-1 line-clamp-2">
                          {module.description || 'No description'}
                        </p>
                      </div>
                      {canManage && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              openModuleForm(module);
                            }}
                            className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition"
                            aria-label={`Edit ${module.type}`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(event) => handleDeleteModule(module, event)}
                            className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 transition"
                            aria-label={`Delete ${module.type}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 text-sm text-gray-400">
                      Status:{' '}
                      <span
                        className={`font-medium ${
                          module.isActive ? 'text-green-600' : 'text-gray-500'
                        }`}
                      >
                        {module.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {isModuleFormOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {moduleBeingEdited ? 'Edit Module' : 'Create Module'}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {moduleBeingEdited
                    ? 'Update the details for this module.'
                    : 'Define a new module for IELTS exercises.'}
                </p>
              </div>
              <button
                onClick={closeModuleForm}
                className="text-gray-500 hover:text-gray-800 transition"
                aria-label="Close module form"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleModuleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Module name</label>
                <input
                  type="text"
                  value={moduleFormState.type}
                  onChange={(event) =>
                    setModuleFormState((prev) => ({ ...prev, type: event.target.value }))
                  }
                  placeholder="e.g., Reading, Writing, Speaking"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={moduleFormState.description}
                  onChange={(event) =>
                    setModuleFormState((prev) => ({ ...prev, description: event.target.value }))
                  }
                  rows={3}
                  placeholder="Optional context about what this module covers."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {moduleFormError && (
                <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {moduleFormError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModuleForm}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={moduleFormSubmitting}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition disabled:opacity-60"
                >
                  {moduleFormSubmitting ? 'Saving...' : moduleBeingEdited ? 'Save Changes' : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModulesManagement;

