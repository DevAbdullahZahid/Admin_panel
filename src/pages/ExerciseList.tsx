import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, ArrowLeft, Loader2, FileText, X, Save, BookOpen } from 'lucide-react';

// --- Type Definitions ---
// Define the types used in the application
interface Module {
    id: string;
    type: string; // e.g., 'Reading', 'Writing'
    status: 'Active' | 'Inactive';
}

interface Exercise {
    id: string;
    moduleId: string;
    title: string;
    content: string;
    type: 'Reading' | 'Writing' | 'Listening';
    difficulty: 'Easy' | 'Medium' | 'Hard';
    status: 'Draft' | 'Published';
}

// --- Simulated Data and Service (Replace with your actual API calls) ---
const MOCK_MODULES: Module[] = [
    { id: 'm1', type: 'Reading Comprehension', status: 'Active' },
    { id: 'm2', type: 'Advanced Essay Writing', status: 'Active' },
];

const MOCK_EXERCISES: Exercise[] = [
    { id: 'e1', moduleId: 'm1', title: 'Passage 1: Climate Change', content: 'The climate is changing...', type: 'Reading', difficulty: 'Hard', status: 'Published' },
    { id: 'e2', moduleId: 'm1', title: 'Passage 2: Ancient History', content: 'Ancient Egypt was great...', type: 'Reading', difficulty: 'Medium', status: 'Draft' },
    { id: 'e3', moduleId: 'm2', title: 'Essay Task: Urbanization', content: 'Discuss the pros and cons...', type: 'Writing', difficulty: 'Medium', status: 'Published' },
    { id: 'e4', moduleId: 'm2', title: 'Creative Writing Prompt', content: 'Write a short story about...', type: 'Writing', difficulty: 'Easy', status: 'Draft' },
];

const simulateFetchExercises = async (moduleId: string): Promise<Exercise[]> => {
    // Simulate filtering exercises by the passed moduleId
    const filtered = MOCK_EXERCISES.filter(e => e.moduleId === moduleId);
    return new Promise(resolve => {
        // Simulate API delay
        setTimeout(() => resolve(filtered), 500); 
    });
};

const simulateSaveExercise = async (exercise: Partial<Exercise>): Promise<Exercise> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const newId = exercise.id || `e${MOCK_EXERCISES.length + 1}`;
            const savedExercise: Exercise = {
                id: newId,
                moduleId: exercise.moduleId || 'm1',
                title: exercise.title || 'New Exercise Title',
                content: exercise.content || 'Content goes here.',
                type: exercise.type || 'Reading',
                difficulty: exercise.difficulty || 'Medium',
                status: exercise.status || 'Draft',
            };
            // In a real app, you would integrate this into your central store/database
            console.log(`Simulating save for exercise ID: ${newId}`);
            resolve(savedExercise);
        }, 300);
    });
};
// ----------------------------------------------------------------------


// --- ExerciseForm Component (Create/Edit View) ---

interface ExerciseFormProps {
    initialData: Exercise | null; // null for creation, Exercise object for editing
    moduleId: string; // Required for new exercises
    onSave: () => void;
    onCancel: () => void;
}

const ExerciseForm: React.FC<ExerciseFormProps> = ({ initialData, moduleId, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Exercise>>(initialData || {
        moduleId: moduleId,
        title: '',
        content: '',
        type: 'Reading',
        difficulty: 'Easy',
        status: 'Draft',
    });
    const [isSaving, setIsSaving] = useState(false);
    
    const isNew = initialData === null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await simulateSaveExercise(formData);
            // In a real app, you would update the global state with the saved data
            alert('Exercise saved successfully!'); // Using alert just for quick demo feedback
            onSave();
        } catch (error) {
            console.error("Failed to save exercise:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <header className="flex justify-between items-center mb-6 border-b pb-4 border-gray-200">
                <h1 className="text-3xl font-extrabold text-gray-900">
                    {isNew ? 'Create New Exercise' : `Edit Exercise: ${initialData?.title}`}
                </h1>
                <button 
                    onClick={onCancel}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 transition"
                >
                    <X className="w-5 h-5" />
                    Cancel
                </button>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                
                {/* Title Input */}
                <div className="flex flex-col">
                    <label htmlFor="title" className="text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        value={formData.title || ''}
                        onChange={handleChange}
                        required
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition"
                        placeholder="e.g., Passage 3: The Industrial Revolution"
                    />
                </div>

                {/* Content Textarea */}
                <div className="flex flex-col">
                    <label htmlFor="content" className="text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                        id="content"
                        name="content"
                        rows={6}
                        value={formData.content || ''}
                        onChange={handleChange}
                        required
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition"
                        placeholder="Enter the reading passage, writing prompt, or detailed instructions here..."
                    />
                </div>

                {/* Type, Difficulty, Status Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    <div className="flex flex-col">
                        <label htmlFor="type" className="text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            id="type"
                            name="type"
                            value={formData.type || 'Reading'}
                            onChange={handleChange}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition"
                        >
                            <option value="Reading">Reading</option>
                            <option value="Writing">Writing</option>
                            <option value="Listening">Listening</option>
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="difficulty" className="text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                        <select
                            id="difficulty"
                            name="difficulty"
                            value={formData.difficulty || 'Easy'}
                            onChange={handleChange}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition"
                        >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="status" className="text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status || 'Draft'}
                            onChange={handleChange}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition"
                        >
                            <option value="Draft">Draft</option>
                            <option value="Published">Published</option>
                        </select>
                    </div>

                </div>

                {/* Submit Button */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        {isSaving ? 'Saving...' : (isNew ? 'Create Exercise' : 'Update Exercise')}
                    </button>
                </div>
            </form>
        </div>
    );
};


// --- ExerciseList Component (The fixed component) ---

interface ExerciseListProps {
    module: Module; // The module object passed from ExerciseManagement
    onBack: () => void; // Function to go back to Module Management
    onEditExercise: (exercise: Exercise) => void; // Added: Function to open form for editing
    onCreateNew: () => void; // Fixed: Function to open form for creation
}

const ExerciseList: React.FC<ExerciseListProps> = ({ module, onBack, onEditExercise, onCreateNew }) => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter mock data based on the current module (m1 or m2)
    const loadExercises = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await simulateFetchExercises(module.id);
            // Only show exercises relevant to this module
            setExercises(data.filter(e => e.moduleId === module.id)); 
        } catch (error) {
            console.error(`Failed to load exercises for module ${module.type}:`, error);
        } finally {
            setIsLoading(false);
        }
    }, [module.id, module.type]);

    useEffect(() => {
        loadExercises();
    }, [loadExercises]);
    
    // Placeholder for delete logic
    const handleDeleteExercise = (exerciseId: string) => {
        // NOTE: We replace window.confirm with a simple console log for this environment
        console.log(`Deleting exercise ${exerciseId} for module ${module.type}`);
        setExercises(prev => prev.filter(e => e.id !== exerciseId));
        alert(`Exercise ${exerciseId} deleted (simulated).`);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="flex justify-between items-center mb-6 border-b pb-4 border-gray-200">
                <div className="flex items-center">
                    <button 
                        onClick={onBack} 
                        className="flex items-center text-purple-600 font-medium hover:text-purple-700 transition mr-4 px-3 py-2 rounded-lg hover:bg-purple-100/50"
                    >
                        <ArrowLeft className="w-5 h-5 mr-1" />
                        Back to Modules
                    </button>
                    <h1 className="text-3xl font-extrabold text-gray-900">
                        {module.type} Exercises
                    </h1>
                </div>
                {/* The FIX: The onClick handler is now connected to the onCreateNew prop */}
                <button
                    onClick={onCreateNew} 
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Create New Exercise
                </button>
            </header>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                {isLoading ? (
                    <div className="text-center py-10 text-gray-500 flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                        <span>Loading exercises for {module.type}...</span>
                    </div>
                ) : exercises.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-xl font-semibold">No Exercises Available</p>
                        <p className="mt-1 text-md">Start by creating your first exercise for the {module.type} module.</p>
                        <button
                            onClick={onCreateNew} 
                            className="mt-4 flex items-center justify-center mx-auto gap-2 px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Add Exercise Now
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {exercises.map(exercise => (
                            <div 
                                key={exercise.id} 
                                // Click the row to edit
                                onClick={() => onEditExercise(exercise)} 
                                className="flex justify-between items-center p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-purple-50 transition duration-150 ease-in-out shadow-sm cursor-pointer"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-lg font-semibold text-gray-800 truncate">{exercise.title}</p>
                                    <div className="text-sm text-gray-500 space-x-3 mt-1 flex items-center">
                                        
                                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                            {exercise.difficulty}
                                        </span>
                                        
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                            exercise.status === 'Published' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {exercise.status}
                                        </span>
                                        <span className="text-xs text-gray-400">Type: {exercise.type}</span>
                                    </div>
                                </div>
                                <div className="flex space-x-2 ml-4">
                                    <button 
                                        // Prevents row-click from also firing Edit logic, but we already have the row-click
                                        // I'll keep the button just for visual consistency, but the row click handles the edit now.
                                        onClick={(e) => { e.stopPropagation(); onEditExercise(exercise); }} 
                                        className="p-2 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-100 transition"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button 
                                        // StopPropagation prevents the row-click (for edit) from firing when clicking trash
                                        onClick={(e) => { e.stopPropagation(); handleDeleteExercise(exercise.id); }} 
                                        className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


// --- App (Main Component to manage the view) ---

const App = () => {
    // Current application view state: 'moduleList', 'exerciseList', or 'exerciseForm'
    const [view, setView] = useState<'moduleList' | 'exerciseList' | 'exerciseForm'>('moduleList');
    // Module currently being managed
    const [selectedModule, setSelectedModule] = useState<Module | null>(null);
    // Exercise currently being edited (null for creation)
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

    // --- Navigation Handlers ---

    // 1. Module List -> Exercise List
    const handleSelectModule = (module: Module) => {
        setSelectedModule(module);
        setView('exerciseList');
        setSelectedExercise(null); // Clear any pending edit
    };

    // 2. Exercise List -> Module List (Back button)
    const handleBackToModules = () => {
        setSelectedModule(null);
        setView('moduleList');
    };

    // 3. Exercise List -> Exercise Form (Create New)
    const handleCreateNewExercise = () => {
        if (!selectedModule) return;
        setSelectedExercise(null); // null means creation mode
        setView('exerciseForm');
    };

    // 4. Exercise List -> Exercise Form (Edit Existing)
    const handleEditExercise = (exercise: Exercise) => {
        setSelectedExercise(exercise); // Exercise object means edit mode
        setView('exerciseForm');
    };

    // 5. Exercise Form -> Exercise List (Save or Cancel)
    const handleReturnToExerciseList = () => {
        setSelectedExercise(null);
        setView('exerciseList');
    };

    // --- Module List Renderer ---
    const renderModuleList = () => (
        <div className="p-8 max-w-3xl mx-auto">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-6 border-b pb-4">
                Module Management
            </h1>
            <p className="text-gray-600 mb-8">Select a module to view and manage its associated exercises.</p>

            <div className="space-y-4">
                {MOCK_MODULES.map(module => (
                    <div 
                        key={module.id} 
                        onClick={() => handleSelectModule(module)}
                        className="flex items-center justify-between p-5 border border-gray-200 rounded-xl shadow-md bg-purple-50 hover:bg-purple-100 transition cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <BookOpen className="w-6 h-6 text-purple-600" />
                            <p className="text-xl font-semibold text-gray-800">{module.type}</p>
                        </div>
                        <span className="text-sm font-medium text-purple-600">
                            Manage Exercises
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

    // --- Main Render Logic ---
    let content;

    switch (view) {
        case 'moduleList':
            content = renderModuleList();
            break;

        case 'exerciseList':
            if (selectedModule) {
                content = (
                    <ExerciseList
                        module={selectedModule}
                        onBack={handleBackToModules}
                        onCreateNew={handleCreateNewExercise} // The fix
                        onEditExercise={handleEditExercise}
                    />
                );
            } else {
                content = (
                    <div className="text-center p-10">
                        <p className="text-red-500">Error: No module selected.</p>
                        <button onClick={handleBackToModules} className="mt-4 text-purple-600 hover:underline">
                            Go Back
                        </button>
                    </div>
                );
            }
            break;

        case 'exerciseForm':
            if (selectedModule) {
                content = (
                    <ExerciseForm
                        initialData={selectedExercise} // Pass null for creation
                        moduleId={selectedModule.id}
                        onSave={handleReturnToExerciseList}
                        onCancel={handleReturnToExerciseList}
                    />
                );
            } else {
                content = (
                    <div className="text-center p-10">
                        <p className="text-red-500">Error: Cannot create/edit without a module.</p>
                        <button onClick={handleBackToModules} className="mt-4 text-purple-600 hover:underline">
                            Go Back
                        </button>
                    </div>
                );
            }
            break;

        default:
            content = renderModuleList();
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans antialiased">
            <script src="https://cdn.tailwindcss.com"></script>
            <div className="container mx-auto py-10">
                {content}
            </div>
        </div>
    );
};

export default App;