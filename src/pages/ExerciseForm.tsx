// src/pages/ExerciseForm.tsx

import React, { useState, useRef, useEffect } from 'react'; // Import useRef and useEffect
import { useForm, SubmitHandler } from 'react-hook-form';
// --- CHANGE: Import PortalUserRole ---
import { Exercise, Task, ExerciseType, PortalUserRole } from '../types';
import AddTaskModal from '../components/AddTaskModal';
import { PlusIcon, SaveIcon, TrashIcon } from '../components/icons';

type ExerciseFormInputs = Omit<Exercise, 'id' | 'tasks'>;

interface ExerciseFormProps {
    exerciseToEdit: Exercise | null;
    moduleType: ExerciseType;
    onClose: () => void;
    currentUserRole: PortalUserRole; // <-- CHANGE: Accept the role
}

const EXERCISES_STORAGE_KEY = 'ielts_saved_exercises';
const getExercisesFromStorage = (): Exercise[] => {
    const stored = localStorage.getItem(EXERCISES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

const ExerciseForm: React.FC<ExerciseFormProps> = ({ exerciseToEdit, moduleType, onClose, currentUserRole }) => {
  const isEditing = !!exerciseToEdit;

  const [currentTasks, setCurrentTasks] = useState<Task[]>(exerciseToEdit ? exerciseToEdit.tasks : []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // --- Refs for hidden file inputs ---
  const imageFileInputRef = useRef<HTMLInputElement>(null); // For Image URL
  const recordingFileInputRef = useRef<HTMLInputElement>(null); // For Recording URL
  // --- State for selected file names ---
  const [selectedImageFileName, setSelectedImageFileName] = useState<string | null>(null);
  const [selectedRecordingFileName, setSelectedRecordingFileName] = useState<string | null>(null);
  // ------------------------------------

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<ExerciseFormInputs>({
    defaultValues: {
      exerciseType: moduleType,
      title: exerciseToEdit?.title || '',
      description: exerciseToEdit?.description || '',
      allowedTime: exerciseToEdit?.allowedTime || 40,
      passage: exerciseToEdit?.passage || '',
      imageUrl: exerciseToEdit?.imageUrl || '',
      recordingUrl: exerciseToEdit?.recordingUrl || '',
    }
  });

  // --- FIX: Reset form when exerciseToEdit changes ---
  useEffect(() => {
    if (exerciseToEdit) {
      reset({
        exerciseType: exerciseToEdit.exerciseType,
        title: exerciseToEdit.title,
        description: exerciseToEdit.description,
        allowedTime: exerciseToEdit.allowedTime,
        passage: exerciseToEdit.passage,
        imageUrl: exerciseToEdit.imageUrl,
        recordingUrl: exerciseToEdit.recordingUrl,
      });
      setCurrentTasks(exerciseToEdit.tasks);
    } else {
      reset({
        exerciseType: moduleType,
        title: '',
        description: '',
        allowedTime: 40,
        passage: '',
        imageUrl: '',
        recordingUrl: '',
      });
      setCurrentTasks([]);
    }
  }, [exerciseToEdit, moduleType, reset]);
  // -----------------------------------------------

  const exerciseType = watch('exerciseType'); // Watch current exercise type selected in form

  // --- TASK MODAL HANDLERS ---
  const handleOpenTaskModal = (taskToEdit: Task | null) => { setEditingTask(taskToEdit); setIsModalOpen(true); }
  const handleCloseTaskModal = () => { setEditingTask(null); setIsModalOpen(false); }
  
  // --- FIX: Implemented handleSaveTask ---
  const handleSaveTask = (taskData: Task, originalTaskId: string | null) => {
    if (originalTaskId) {
      // Editing existing task
      setCurrentTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === originalTaskId ? { ...taskData, id: task.id } : task // Ensure ID is preserved
        )
      );
    } else {
      // Adding new task
      const newTask = { ...taskData, id: crypto.randomUUID() }; // Assign a new unique ID
      setCurrentTasks(prevTasks => [...prevTasks, newTask]);
    }
    handleCloseTaskModal(); // Close modal on save
  };
  // --------------------------------------

  // --- FIX: Implemented handleRemoveTask ---
  const handleRemoveTask = (taskId: string) => {
    // --- CHANGE: Removed permission check for Editor ---
    // (Editors can now remove tasks)
    // -------------------------------------------
    if (window.confirm("Are you sure you want to remove this task?")) {
      setCurrentTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    }
  };
  // ----------------------------------------

  // --- FIX: Implemented MAIN FORM SUBMISSION ---
  const onSaveExercise: SubmitHandler<ExerciseFormInputs> = (data) => {
    const allExercises = getExercisesFromStorage();
    let updatedList: Exercise[] = [];

    const exercise: Exercise = {
        ...data,
        id: exerciseToEdit ? exerciseToEdit.id : crypto.randomUUID(), // Keep existing ID or create new one
        tasks: currentTasks, // Attach the tasks
        exerciseType: moduleType, // Ensure correct module type
    };

    if (isEditing) {
      // Update existing exercise
      updatedList = allExercises.map(ex => 
        ex.id === exercise.id ? exercise : ex
      );
    } else {
      // Add new exercise
      updatedList = [...allExercises, exercise];
    }

    // Save back to local storage
    localStorage.setItem(EXERCISES_STORAGE_KEY, JSON.stringify(updatedList));
    
    // Log and go back to list
    console.log("Exercise saved:", exercise);
    onClose(); 
  };
  // ------------------------------------------

  // --- File Picker Handlers ---
  const handleImageButtonClick = () => { imageFileInputRef.current?.click(); };
  const handleRecordingButtonClick = () => { recordingFileInputRef.current?.click(); };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImageFileName(file.name);
      setValue('imageUrl', `local_file:${file.name}`); // Update input field
    } else {
      setSelectedImageFileName(null);
    }
    // Reset the input value so the same file can be selected again if needed
    if (event.target) event.target.value = '';
  };

  const handleRecordingFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedRecordingFileName(file.name);
      setValue('recordingUrl', `local_file:${file.name}`); // Update input field
    } else {
      setSelectedRecordingFileName(null);
    }
     // Reset the input value
     if (event.target) event.target.value = '';
  };
  // -----------------------------

  const commonInputClasses = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const labelClasses = "block text-sm font-medium text-gray-700";

  // --- CHANGE: Removed permission check ---
  // If user is 'Editor' AND is not editing (i.e., is in 'create' mode)
  // This block has been removed to allow Editors to create exercises.
  // ------------------------------------

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{isEditing ? `Edit ${moduleType} Exercise` : `Create New ${moduleType} Exercise`}</h1>
        <button type="button" onClick={onClose} className="text-blue-600 hover:text-blue-800 flex items-center font-medium">
             &larr; Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit(onSaveExercise)} className="bg-white p-6 rounded-lg shadow-md mb-8">
        {/* ... (Exercise Details Header and Save Button) ... */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-xl font-semibold text-gray-800">Exercise Details</h2>
            <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <SaveIcon className="mr-2 w-4 h-4" />
              {isEditing ? 'Update Exercise' : 'Save New Exercise'}
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ... (Exercise Type, Title, Description, Allowed Time - remain the same) ... */}
            <div>
                <label className={labelClasses}>Exercise Type</label>
                <input type="text" value={moduleType} readOnly className={`${commonInputClasses} bg-gray-100 text-gray-500`} />
            </div>
            <div>
                <label htmlFor="title" className={labelClasses}>Title</label>
                <input type="text" id="title" {...register('title', { required: 'This field is required' })} className={commonInputClasses} />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div className="md:col-span-2">
                <label htmlFor="description" className={labelClasses}>Description</label>
                <textarea id="description" rows={3} {...register('description', { required: 'This field is required' })} className={commonInputClasses}></textarea>
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>
            <div>
                <label htmlFor="allowedTime" className={labelClasses}>Allowed Time (minutes)</label>
                <input type="number" id="allowedTime" {...register('allowedTime', { required: 'This field is required', valueAsNumber: true, min: 1 })} className={commonInputClasses} />
                {errors.allowedTime && <p className="text-red-500 text-xs mt-1">{errors.allowedTime.message || "Must be at least 1"}</p>}
            </div>


            {/* Conditional Passage/Media Fields */}
            {(moduleType === 'Reading' || moduleType === 'Writing') && (
                <div className="md:col-span-2">
                    <label htmlFor="passage" className={labelClasses}>Passage / Task Prompt</label>
                    <textarea id="passage" rows={5} {...register('passage')} className={commonInputClasses}></textarea>
                </div>
            )}

            {/* --- Image URL + Picker --- */}
            {moduleType === 'Reading' && (
                <div className="md:col-span-2">
                    <label htmlFor="imageUrl" className={labelClasses}>Image URL (for charts/diagrams)</label>
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            id="imageUrl"
                            {...register('imageUrl')}
                            className={commonInputClasses + " flex-grow"}
                            placeholder="Enter URL or choose local file"
                        />
                        <input
                            type="file"
                            ref={imageFileInputRef}
                            onChange={handleImageFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={handleImageButtonClick}
                            className="flex-shrink-0 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Choose Image
                        </button>
                    </div>
                    {selectedImageFileName && (
                        <p className="text-xs text-gray-500 mt-1">Selected: {selectedImageFileName}</p>
                    )}
                </div>
            )}
            {/* --------------------------- */}

            {/* --- Recording URL + Picker --- */}
            {(moduleType === 'Listening' || moduleType === 'Speaking') && (
                <div className="md:col-span-2">
                    <label htmlFor="recordingUrl" className={labelClasses}>Recording URL</label>
                     <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            id="recordingUrl"
                            {...register('recordingUrl')}
                            className={commonInputClasses + " flex-grow"}
                            placeholder="Enter URL or choose local file"
                        />
                        <input
                            type="file"
                            ref={recordingFileInputRef}
                            onChange={handleRecordingFileChange}
                            accept="audio/*,video/*" // Accept audio or video files
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={handleRecordingButtonClick}
                            className="flex-shrink-0 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Choose File
                        </button>
                    </div>
                     {selectedRecordingFileName && (
                        <p className="text-xs text-gray-500 mt-1">Selected: {selectedRecordingFileName}</p>
                    )}
                </div>
            )}
            {/* --------------------------- */}
        </div>
      </form>

      {/* ... (Tasks Section remains the same) ... */}
       <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-xl font-semibold text-gray-800">Tasks Included</h2>
          {/* --- CHANGE: Removed permission check. Editors can now see this button. --- */}
          <button type="button" onClick={() => handleOpenTaskModal(null)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
            <PlusIcon className="mr-2 w-4 h-4" />
            Add New Task
          </button>
          {/* ------------------------------------------- */}
        </div>
        <div className="space-y-4">
          {currentTasks.length > 0 ? currentTasks.map((task, index) => (
            <div key={task.id} className="p-4 border rounded-md flex justify-between items-center bg-gray-50">
              <div>
                <p className="font-semibold text-gray-700">{index + 1}. {task.title}</p>
                <p className="text-sm text-gray-500">Type: {task.taskType}</p>
              </div>
              <div className="flex space-x-2">
                <button type="button" onClick={() => handleOpenTaskModal(task)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Edit</button>
                <button type="button" onClick={() => handleRemoveTask(task.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
              </div>
            </div>
          )) : <p className="text-center text-gray-500 py-4">No tasks added yet. Add tasks above.</p>}
        </div>
      </div>

      <AddTaskModal
        isOpen={isModalOpen}
        onClose={handleCloseTaskModal}
        editingTask={editingTask}
        onSaveTask={handleSaveTask}
      />
    </>
  );
};

export default ExerciseForm;

