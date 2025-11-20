// src/pages/ExerciseForm.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { apiFetch } from '../utils/apiService'; 
import { Exercise, Task, ExerciseType, PortalUserRole } from '../types'; 
import AddTaskModal from '../components/AddTaskModal';
import { PlusIcon, SaveIcon, TrashIcon } from '../components/icons';

// --- Utility Functions (Must be outside the main component) ---

const moduleTypeToId = (m: ExerciseType | string): number => {
    switch (m) {
        case 'Reading': return 1;
        case 'Writing': return 2;
        case 'Listening': return 3;
        case 'Speaking': return 4;
        default: return 0;
    }
};

/**
 * Transforms the local Task object into the payload required by the backend /tasks API.
 * Includes task_id for PUT (update) requests.
 */
const API_TASK_TYPE_MAP: Record<string, string> = {
    'MCQ': 'mcq',
    'Filling Blanks': 'filling_blanks',
    'Matching': 'matching',
    'QA': 'qa',
    'Writing': 'writing',
    'Speaking': 'speaking',
};

const API_TO_UI_TASK_TYPE: Record<string, string> = {
    'mcq': 'MCQ',
    'filling_blanks': 'Filling Blanks',
    'matching': 'Matching',
    'qa': 'QA',
    'writing': 'Writing',
    'speaking': 'Speaking',
};

const transformTaskForAPI = (task: Task, exerciseId: number): any => {
    const taskTypeMap: Record<string, string> = {
        'MCQ': 'mcq',
        'Filling Blanks': 'filling_blanks',
        'Matching': 'matching',
        'QA': 'qa',
        'Writing': 'writing',
        'Speaking': 'speaking'
    };

    const resolvedType = taskTypeMap[task.taskType] || task.taskType?.toLowerCase();

    const base: any = {
        exercise_id: exerciseId,
        type: resolvedType,
        title: task.title,
        description: task.description || '',
        allowed_time: Number(task.allowedTime) || 0,
    };

    // ✅ CRITICAL FIX: Only include task_id for existing tasks
    if (task.apiId) {
        base.task_id = task.apiId;
    }

    // --- MCQ ---
    if (resolvedType === 'mcq') {
        base.mcqs = (task.questions || []).map((q: any) => ({
            question_text: q.questionText || q.question || '',
            allow_multiple: !!(q.allowMultipleSelections ?? task.allowMultipleSelections),
            options: (q.options || []).map((o: any) => ({
                option_text: typeof o === 'object' ? o.value : String(o ?? ''),
                is_true: typeof o === 'object' ? !!o.isCorrect : false,
            })),
        }));
    }

    // --- Filling Blanks --- ✅ FIXED
    if (resolvedType === 'filling_blanks') {
        if (task.maxWordsPerBlank) {
            base.max_words = Number(task.maxWordsPerBlank);
        }
        
        base.filling_blanks = (task.blanks || []).map((b: any, index: number) => {
            // Handle both string and array formats
            let answersArray: string[] = [];
            
            if (Array.isArray(b.correctAnswers) && b.correctAnswers.length > 0) {
                answersArray = b.correctAnswers;
            } else if (b.correctAnswer) {
                // Convert comma-separated string to array
                answersArray = String(b.correctAnswer)
                    .split(',')
                    .map((ans: string) => ans.trim())
                    .filter(Boolean);
            }
            
            return {
                question_text: b.questionText || b.textBefore || '',
                correct_answer: answersArray.join(', '), // API expects comma-separated string
                position: b.position || index + 1,
            };
        });
    }

    // --- Matching ---
    if (resolvedType === 'matching') {
        base.group1 = (task.group1 || []).map((g: any) => 
            typeof g === 'object' ? g.value : g
        );
        base.group2 = (task.group2 || []).map((g: any) => 
            typeof g === 'object' ? g.value : g
        );
        if (task.answers) {
            base.answers = task.answers;
        }
    }

    // --- QA ---
    if (resolvedType === 'qa') {
        base.question_prompts = (task.questions || []).map((q: any) => 
            q.value || q.questionText || ''
        );
        if (task.maxWordsPerAnswer) {
            base.max_words = Number(task.maxWordsPerAnswer);
        }
        if (task.minimumWordCount) {
            base.min_words = Number(task.minimumWordCount);
        }
        if (task.answers) {
            base.answers = task.answers;
        }
    }

    // --- Writing ---
    if (resolvedType === 'writing') {
        if (task.minimumWordCount) {
            base.min_words = Number(task.minimumWordCount);
        }
        if (task.maxWords) {
            base.max_words = Number(task.maxWords);
        }
        if (task.questions) {
            base.question_prompts = task.questions.map((q: any) => 
                q.value || q.questionText || ''
            );
        }
    }

    // --- Speaking ---
    if (resolvedType === 'speaking') {
        if (task.questions) {
            base.question_prompts = task.questions.map((q: any) => 
                q.value || q.questionText || ''
            );
        }
    }

    console.log('📤 Transformed Task Payload:', JSON.stringify(base, null, 2));
    return base;
};
// --- Interfaces and Types ---

interface ExerciseWithIds extends Exercise {
    passage_id?: number | null;
    image_id?: number | null;
    recording_id?: number | null;
}

type ExerciseFormInputs = {
    title: string;
    description: string;
    allowedTime: number;
    passage?: string; 
    imageUrl?: string; 
    recordingUrl?: string; 
};

interface ExerciseFormProps {
    exerciseToEdit: ExerciseWithIds | null;
    moduleType: ExerciseType | string;
    moduleId: number;
    onClose: () => void;
    currentUserRole: PortalUserRole;
}

// --- Main Component ---

const ExerciseForm: React.FC<ExerciseFormProps> = ({ exerciseToEdit, moduleType, moduleId, onClose }) => {
    const isEditing = !!exerciseToEdit;

    const initialTasks = exerciseToEdit?.tasks ? exerciseToEdit.tasks : [];
    
    const [currentTasks, setCurrentTasks] = useState<Task[]>(initialTasks);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [exerciseId, setExerciseId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    // Asset IDs and states...
    const [passageId, setPassageId] = useState<number | null>(exerciseToEdit?.passage_id ?? null);
    const [initialPassageText, setInitialPassageText] = useState<string>('');
    const [imageId, setImageId] = useState<number | null>(exerciseToEdit?.image_id ?? null);
    const [recordingId, setRecordingId] = useState<number | null>(exerciseToEdit?.recording_id ?? null);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [selectedRecordingFile, setSelectedRecordingFile] = useState<File | null>(null);
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
    const [existingRecordingUrl, setExistingRecordingUrl] = useState<string | null>(null);

    const [pendingTasksToUpload, setPendingTasksToUpload] = useState<Task[]>(initialTasks);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ExerciseFormInputs>({
        defaultValues: {
            title: exerciseToEdit?.title || '',
            description: exerciseToEdit?.description || '',
            allowedTime: exerciseToEdit?.allowed_time || 40,
            passage: '',
        }
    });

    /**
     * Helper to transform fetched API tasks into the local Task type.
     * NOTE: You must ensure this maps nested data (mcqs, blanks) correctly for editing modal use.
     */
    const normalizeFetchedTask = (t: any): Task => {
        const resolvedType = API_TO_UI_TASK_TYPE[(t.type || '').toLowerCase()] || t.type || 'Matching';

        const baseTask: any = {
            id: String(t.task_id || t.id),
            apiId: Number(t.task_id || t.id),
            taskType: resolvedType,
            title: t.title,
            description: t.description || '',
            allowedTime: t.allowed_time || 0,
            minimumWordCount: t.min_words || undefined,
            maxWords: t.max_words || undefined,
            maxWordsPerBlank: t.max_words_per_blank || t.max_words || undefined,
            allowMultipleSelections: t.allow_multiple || false,
            group1: t.group1 || [],
            group2: t.group2 || [],
            answers: t.answers || [],
        };

        if (resolvedType === 'MCQ') {
            baseTask.questions = (t.mcqs || []).map((mcq: any) => ({
                id: String(mcq.id || crypto.randomUUID()),
                questionText: mcq.question_text || mcq.question || '',
                allowMultipleSelections: !!mcq.allow_multiple,
                options: (mcq.options || []).map((opt: any) => ({
                    id: String(opt.id || crypto.randomUUID()),
                    value: opt.option_text || opt.value || '',
                    isCorrect: !!opt.is_true,
                })),
            }));
        } else if (resolvedType === 'Filling Blanks') {
            baseTask.blanks = (t.filling_blanks || []).map((blank: any, index: number) => {
                const answerList = blank.correct_answer
                    ? String(blank.correct_answer)
                        .split(',')
                        .map((ans: string) => ans.trim())
                        .filter(Boolean)
                    : [];
                return {
                    id: String(blank.id || crypto.randomUUID()),
                    questionText: blank.question_text || '',
                    correctAnswers: answerList,
                    correctAnswer: answerList.join(', '),
                    position: blank.position || index + 1,
                };
            });
            baseTask.maxWordsPerBlank = t.max_words || t.max_words_per_blank || undefined;
        } else if (resolvedType === 'QA' || resolvedType === 'Writing' || resolvedType === 'Speaking') {
            const prompts = t.question_prompts || [];
            baseTask.questions = prompts.map((prompt: string) => ({
                id: crypto.randomUUID(),
                value: prompt,
            }));
            if (t.max_words) baseTask.maxWordsPerAnswer = t.max_words;
            if (t.min_words) baseTask.minimumWordCount = t.min_words;
        }

        return baseTask as Task;
    };

    // --- Core API Upload Helpers (Assumed correct) ---
    const uploadPassageApi = async (title: string, text: string): Promise<number> => {
        const res = await apiFetch('/passages', {
            method: 'POST',
            body: JSON.stringify({ title, text }),
        });
        return Number(res?.data?.passage?.passage_id || 0); 
    };

    const uploadImageApi = async (file: File): Promise<number> => {
        const fd = new FormData();
        fd.append('title', file.name);
        fd.append('file', file);
        const res = await apiFetch('/images', {
            method: 'POST',
            headers: {}, 
            body: fd,
        });
        return Number(res?.data?.image?.image_id || 0); 
    };

    const uploadRecordingApi = async (file: File): Promise<number> => {
        const fd = new FormData();
        fd.append('title', file.name);
        fd.append('file', file);
        const res = await apiFetch('/recordings', {
            method: 'POST',
            headers: {}, 
            body: fd,
        });
        return Number(res?.data?.recording?.recording_id || 0); 
    };
    // --- End API Upload Helpers ---


    // 🚀 Function to fetch detailed assets and tasks for editing (Conditional task fetch)
    const fetchExerciseDetails = useCallback(async (exerciseId: number, currentPassageId: number | null, currentImageId: number | null, currentRecordingId: number | null) => {
        if (!isEditing || !exerciseId) return;

        setIsFetching(true);
        try {
            // 1-3. Fetch Passage, Image, Recording 
            if (currentPassageId) {
                const passageRes = await apiFetch(`/passages/${currentPassageId}`);
                const passageText = passageRes?.data?.passage?.text || '';
                setValue('passage', passageText);
                setInitialPassageText(passageText || '');
            }
            if (currentImageId) {
                const imageRes = await apiFetch(`/images/${currentImageId}`);
                setExistingImageUrl(imageRes?.data?.image?.url || null); 
            }
            if (currentRecordingId) {
                const recordingRes = await apiFetch(`/recordings/${currentRecordingId}`);
                setExistingRecordingUrl(recordingRes?.data?.recording?.url || null);
            }
            
            const tasksRes = await apiFetch(`/tasks?exercise_id=${exerciseId}`);
            const fetchedTasks = tasksRes?.data?.tasks || [];
            
            if (Array.isArray(fetchedTasks)) {
                const normalizedTasks = fetchedTasks.map(normalizeFetchedTask);
                setCurrentTasks(normalizedTasks);
                setPendingTasksToUpload(normalizedTasks);
            }

        } catch (err) {
            console.error('Failed to fetch exercise details for editing:', err);
        } finally {
            setIsFetching(false);
        }
    }, [isEditing, setValue, moduleType]); // Dependency on moduleType added

    useEffect(() => {
        if (exerciseToEdit) {
            // Reset form fields
            reset({
                title: exerciseToEdit.title || '',
                description: exerciseToEdit.description || '',
                allowedTime: exerciseToEdit.allowed_time || 40,
            });
            setExerciseId(Number(exerciseToEdit.id));
            
            const pId = exerciseToEdit.passage_id ?? null;
            const iId = exerciseToEdit.image_id ?? null;
            const rId = exerciseToEdit.recording_id ?? null;
            
            setPassageId(pId);
            setImageId(iId);
            setRecordingId(rId);

            fetchExerciseDetails(Number(exerciseToEdit.id), pId, iId, rId);

        } else {
            // Reset for new creation
            reset({ title: '', description: '', allowedTime: 40, passage: '' });
            setCurrentTasks([]);
            setPendingTasksToUpload([]);
            setExerciseId(Date.now()); 
            setPassageId(null);
            setInitialPassageText('');
            setImageId(null);
            setRecordingId(null);
            setExistingImageUrl(null);
            setExistingRecordingUrl(null);
        }
    }, [exerciseToEdit, reset, fetchExerciseDetails, moduleType]); // moduleType dependency added


    // --- Task Handlers (Assumed correct) ---
    const handleSaveTask = (taskData: Task, originalTaskId: string | null) => {
        if (originalTaskId) {
            // Update existing task in both states
            setCurrentTasks(prev => prev.map(t => t.id === originalTaskId ? taskData : t));
            setPendingTasksToUpload(prev => prev.map(t => t.id === originalTaskId ? taskData : t));
        } else {
            // Add new task
            const tempId = crypto.randomUUID();
            const newTask = { ...taskData, id: tempId };
            setCurrentTasks(prev => [...prev, newTask]);
            setPendingTasksToUpload(prev => [...prev, newTask]);
        }
        setIsModalOpen(false);
        setEditingTask(null);
    };

    const handleRemoveTask = async (taskId: string) => {
        if (!confirm('Remove this task?')) return;

        const taskToRemove = currentTasks.find(t => t.id === taskId);

        setCurrentTasks(prev => prev.filter(t => t.id !== taskId));
        setPendingTasksToUpload(prev => prev.filter(t => t.id !== taskId));

        if (taskToRemove?.apiId) {
            try {
                await apiFetch(`/tasks/${taskToRemove.apiId}`, { method: 'DELETE' });
            } catch (err) {
                console.error('Failed to delete task:', err);
                alert('Failed to delete task from server.');
            }
        }
    };


    // --- MAIN SAVE HANDLER (Conditional task save logic) ---

    const onSaveExercise: SubmitHandler<ExerciseFormInputs> = async (data) => {
        if (!data.title?.trim()) return alert('Title is required');
        
        if (moduleType === 'Reading' && currentTasks.length === 0) {
            return alert('Please add at least one task for the Reading module.');
        }
        
        setIsSaving(true);
        let finalPassageId = passageId;
        let finalImageId = imageId;
        let finalRecordingId = recordingId;

        try {
            const exerciseTitle = data.title.trim();

            // 1-3. UPLOAD ASSETS
            const trimmedPassage = data.passage?.trim();
            const normalizedInitialPassage = initialPassageText?.trim?.() || '';
            const shouldUploadPassage = !!trimmedPassage && (!isEditing || trimmedPassage !== normalizedInitialPassage || !passageId);

            if ((moduleType === 'Reading' || moduleType === 'Writing') && shouldUploadPassage) {
                finalPassageId = await uploadPassageApi(`${exerciseTitle} - Passage`, trimmedPassage!);
                if (!finalPassageId) throw new Error("Failed to upload passage."); 
                setInitialPassageText(trimmedPassage || '');
            }
            if (moduleType === 'Reading' && selectedImageFile) { 
                finalImageId = await uploadImageApi(selectedImageFile);
                if (!finalImageId) throw new Error("Failed to upload image.");
            }
            if ((moduleType === 'Listening' || moduleType === 'Speaking') && selectedRecordingFile) {
                finalRecordingId = await uploadRecordingApi(selectedRecordingFile);
                if (!finalRecordingId) throw new Error("Failed to upload recording.");
            }

            let finalExerciseId = isEditing ? Number(exerciseToEdit?.id) : exerciseId;
            if (!finalExerciseId) throw new Error("Exercise ID could not be determined.");

            // 4. PREPARE MAIN EXERCISE PAYLOAD
            const resolvedModuleId = moduleId || moduleTypeToId(moduleType);

            const exercisePayload = {
                exercise_id: finalExerciseId,
                module_id: resolvedModuleId,
                title: exerciseTitle,
                description: data.description?.trim() || null,
                allowed_time: Number(data.allowedTime) || 40,
                passage_id: finalPassageId || null,
                image_id: finalImageId || null,
                recording_id: finalRecordingId || null,
            };

            // 5. POST/PUT MAIN EXERCISE
            let exerciseRes;
            if (isEditing) {
                exerciseRes = await apiFetch(`/exercises/${finalExerciseId}`, {
                    method: 'PUT',
                    body: JSON.stringify(exercisePayload),
                });
            } else {
                exerciseRes = await apiFetch('/exercises', {
                    method: 'POST',
                    body: JSON.stringify(exercisePayload),
                });
                
                const officialExerciseId = 
                    exerciseRes?.data?.exercise?.exercise_id || 
                    exerciseRes?.exercise_id ||                  
                    exerciseRes?.data?.exercise_id; 

                if (!officialExerciseId) {
                    throw new Error("Backend did not return official exercise ID.");
                }
                finalExerciseId = officialExerciseId;
            }

            if (pendingTasksToUpload.length > 0) {
                console.log('📋 Uploading tasks:', pendingTasksToUpload.length);
                
                for (const task of pendingTasksToUpload) {
                    try {
                        // Transform task
                        const taskPayload = transformTaskForAPI(task, finalExerciseId!);
                        
                        // Determine if update or create based on apiId
                        const isUpdate = !!task.apiId;
                        const method = isUpdate ? 'PUT' : 'POST';
                        const url = isUpdate ? `/tasks/${task.apiId}` : '/tasks';
                        
                        console.log(`📡 ${method} ${url}`, taskPayload);
                        
                        const result = await apiFetch(url, {
                            method: method,
                            body: JSON.stringify(taskPayload),
                        });
                        
                        console.log(`✅ ${method} Success:`, result);
                        
                    } catch (err: any) {
                        console.error(`❌ Failed to ${task.apiId ? 'update' : 'create'} task "${task.title}":`, err);
                        throw new Error(`Task "${task.title}" failed: ${err.message}`);
                    }
                }
                
                setPendingTasksToUpload([]);
                console.log('✅ All tasks uploaded successfully');
            }
            
            alert(`Exercise ${isEditing ? 'updated' : 'created'} successfully! ID: ${finalExerciseId}`);
            onClose();

        } catch (err: any) {
            console.error('Save failed:', err);
            alert('Save failed: ' + (err.message || 'Check console'));
        } finally {
            setIsSaving(false);
        }
    };

    const commonInputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
    const labelClasses = "block text-sm font-medium text-gray-700";
    const assetStatusClasses = (id: number | null) => 
        `text-sm font-medium ${id ? 'text-green-600' : 'text-gray-500'}`;

    if (isEditing && isFetching) {
        return <div className="text-center py-20 text-xl text-gray-600">Loading exercise details...</div>;
    }

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">
                    {isEditing ? `Edit ${moduleType}` : `Create New ${moduleType}`} Exercise
                </h1>
                <button onClick={onClose} className="text-blue-600 hover:underline">Back</button>
            </div>

            <form onSubmit={handleSubmit(onSaveExercise)} className="bg-white p-6 rounded-lg shadow-md space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                    <h2 className="text-xl font-semibold">Exercise Details</h2>
                    <button type="submit" disabled={isSaving} className={`px-5 py-2 rounded flex items-center gap-2 ${isSaving ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                        <SaveIcon className="w-4 h-4" />
                        {isSaving ? 'Saving...' : (isEditing ? 'Update Exercise' : 'Save Exercise')}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClasses}>Type</label>
                        <input value={moduleType} readOnly className={`${commonInputClasses} bg-gray-100`} />
                    </div>
                    <div>
                        <label className={labelClasses}>Title *</label>
                        <input {...register('title', { required: true })} className={commonInputClasses} />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClasses}>Description</label>
                        <textarea {...register('description')} rows={3} className={commonInputClasses} />
                    </div>
                    <div>
                        <label className={labelClasses}>Allowed Time (mins)</label>
                        <input type="number" {...register('allowedTime')} className={commonInputClasses} />
                    </div>

                    {/* PASSAGE INPUT */}
                    {(moduleType === 'Reading' || moduleType === 'Writing') && (
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Passage / Prompt</label>
                            <textarea {...register('passage')} rows={8} className={commonInputClasses} placeholder="Enter the text passage or writing prompt here." />
                            <p className={assetStatusClasses(passageId)}>Status: {passageId ? `Passage content loaded (ID: ${passageId})` : 'New passage will be uploaded on save.'}</p>
                        </div>
                    )}

                    {/* IMAGE INPUT & DISPLAY */}
                    {moduleType === 'Reading' && (
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Image (Chart/Diagram)</label>
                            {existingImageUrl && !selectedImageFile && (
                                <div className="mb-2 p-2 border rounded">
                                    <p className="text-xs text-gray-500">Existing Image:</p>
                                    <img src={existingImageUrl} alt="Existing Asset" className="max-w-xs max-h-40 object-contain" />
                                </div>
                            )}
                            <div className="flex gap-2 items-center">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => setSelectedImageFile(e.target.files?.[0] || null)} 
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>
                            <p className={assetStatusClasses(imageId)}>Status: 
                                {selectedImageFile 
                                    ? `New file selected: ${selectedImageFile.name}. Will upload on save.`
                                    : (imageId ? `No new file. Existing ID: ${imageId}` : 'No image selected.')}
                            </p>
                        </div>
                    )}

                    {/* RECORDING INPUT & DISPLAY */}
                    {(moduleType === 'Listening' || moduleType === 'Speaking') && (
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Audio Recording</label>
                            {existingRecordingUrl && !selectedRecordingFile && (
                                <div className="mb-2 p-2 border rounded">
                                    <p className="text-xs text-gray-500">Existing Recording:</p>
                                    <audio controls src={existingRecordingUrl} className="w-full" />
                                </div>
                            )}
                            <div className="flex gap-2 items-center">
                                <input 
                                    type="file" 
                                    accept="audio/*,video/*" 
                                    onChange={(e) => setSelectedRecordingFile(e.target.files?.[0] || null)} 
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>
                            <p className={assetStatusClasses(recordingId)}>Status: 
                                {selectedRecordingFile 
                                    ? `New file selected: ${selectedRecordingFile.name}. Will upload on save.`
                                    : (recordingId ? `No new file. Existing ID: ${recordingId}` : 'No recording selected.')}
                            </p>
                        </div>
                    )}
                </div>
            </form>
            
            {/* Task list rendering */}
                <div className="bg-white p-6 rounded-lg shadow-md mt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Tasks ({currentTasks.length})</h2>
                        <button onClick={() => { setEditingTask(null); setIsModalOpen(true); }} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center gap-2">
                            <PlusIcon className="w-5 h-5" /> Add Task
                        </button>
                    </div>

                    {currentTasks.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No tasks yet</p>
                    ) : (
                        <div className="space-y-3">
                            {currentTasks.map((task, i) => (
                                <div key={task.id} className="flex justify-between items-center p-4 bg-gray-50 rounded border">
                                    <div>
                                        <strong>{i + 1}. {task.title}</strong>
                                        <span className="ml-3 text-sm text-gray-600">({task.taskType})</span>
                                        {pendingTasksToUpload.some(t => t.id === task.id) && (
                                            <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">Pending Save</span>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => { setEditingTask(task); setIsModalOpen(true); }} className="text-indigo-600 hover:text-indigo-800">Edit</button>
                                        <button onClick={() => handleRemoveTask(task.id)} className="text-red-600 hover:text-red-800 p-1 rounded">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            
            
            <AddTaskModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
                editingTask={editingTask}
                onSaveTask={handleSaveTask}
            />
        </>
    );
};

export default ExerciseForm;