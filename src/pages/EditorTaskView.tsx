// src/pages/EditorTaskView.tsx 

import React, { useState } from 'react';
import { Exercise, Task, MCQTask, MatchingTask, FillingBlanksTask, QATask, WritingTask } from '../types';
import { sampleExercises } from '../data/sampleExercises'; 
import { useAuth } from '../hooks/useAuth';
import { LogoutIcon } from '../components/icons';

// --- PERSISTENCE LOGIC ---
const EXERCISES_STORAGE_KEY = 'ielts_saved_exercises';
const ANSWERS_STORAGE_KEY = 'ielts_editor_answers';

const getPersistedExercises = (): Exercise[] => {
    // ... (logic remains the same) ...
    const storedExercises = localStorage.getItem(EXERCISES_STORAGE_KEY);
    if (storedExercises) return JSON.parse(storedExercises);
    localStorage.setItem(EXERCISES_STORAGE_KEY, JSON.stringify(sampleExercises));
    return sampleExercises;
};

const getInitialAnswers = (userId: string): Record<string, Record<string, any>> => {
    // ... (logic remains the same) ...
    const storedAnswers = localStorage.getItem(ANSWERS_STORAGE_KEY);
    const allAnswers = storedAnswers ? JSON.parse(storedAnswers) : {};
    return allAnswers[userId] || {}; 
};

const saveAnswersToLocalStorage = (userId: string, exerciseId: string, taskId: string, answers: any) => {
    // ... (logic remains the same) ...
    const storedAnswers = localStorage.getItem(ANSWERS_STORAGE_KEY);
    const allAnswers = storedAnswers ? JSON.parse(storedAnswers) : {};
    if (!allAnswers[userId]) allAnswers[userId] = {};
    if (!allAnswers[userId][exerciseId]) allAnswers[userId][exerciseId] = {};
    allAnswers[userId][exerciseId][taskId] = answers;
    localStorage.setItem(ANSWERS_STORAGE_KEY, JSON.stringify(allAnswers));
};

interface TaskRendererProps {
    task: Task;
    userId: string;
    exerciseId: string;
}

// --- MCQ Renderer (remains the same) ---
const MCQQuestionRenderer: React.FC<TaskRendererProps & { task: MCQTask }> = ({ task, userId, exerciseId }) => {
    // ... (MCQ logic with Save button) ...
    const initialAnswers = getInitialAnswers(userId)[exerciseId]?.[task.id] || {};
    const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>(initialAnswers);
    const [isSaved, setIsSaved] = useState(true); 

    const handleChange = (questionId: string, optionId: string) => {
        const questionData = userAnswers[questionId] || [];
        let newSelection: string[];
        if (task.allowMultipleSelections) {
            newSelection = questionData.includes(optionId) ? questionData.filter(id => id !== optionId) : [...questionData, optionId];
        } else {
            newSelection = [optionId];
        }
        setUserAnswers({ ...userAnswers, [questionId]: newSelection });
        setIsSaved(false); 
    };
    const handleSave = () => {
        saveAnswersToLocalStorage(userId, exerciseId, task.id, userAnswers);
        setIsSaved(true);
    };
    const isQuestionAnswered = (questionId: string) => userAnswers[questionId]?.length > 0;
    const isAnswered = task.questions.every(q => isQuestionAnswered(q.id));
    
    return (
        <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800">Task (MCQ): {task.title}</h4>
            <p className="text-gray-600 mb-4">{task.description}</p>
            {task.questions.map((question, qIndex) => (
                <div key={question.id} className="mb-4 p-3 border rounded-md bg-gray-50">
                    <p className="font-medium text-gray-700">{qIndex + 1}. {question.questionText}</p>
                    <div className="space-y-2 mt-2 ml-4">
                        {question.options.map((option) => (
                            <label key={option.id} className="flex items-center text-sm cursor-pointer">
                                <input type={task.allowMultipleSelections ? 'checkbox' : 'radio'} name={`mcq-${question.id}`} checked={(userAnswers[question.id] || []).includes(option.id)} onChange={() => handleChange(question.id, option.id)} className="mr-2 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"/>
                                {option.value}
                            </label>
                        ))}
                    </div>
                </div>
            ))}
            <div className="mt-4 border-t pt-3 flex justify-between items-center">
                <button onClick={handleSave} disabled={isSaved} className={`px-4 py-2 ${isSaved ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md transition-colors`}>{isSaved ? 'Answers Saved' : 'Save Answers'}</button>
                <span className={`ml-3 text-sm font-medium ${isAnswered ? 'text-green-700' : 'text-yellow-600'}`}>Status: {isAnswered ? 'All Questions Answered' : 'Unanswered'}</span>
            </div>
        </div>
    );
};


// --- UPDATED Filling Blanks Renderer ---
const FillingBlanksRenderer: React.FC<TaskRendererProps & { task: FillingBlanksTask }> = ({ task, userId, exerciseId }) => {
    const initialAnswers = getInitialAnswers(userId)[exerciseId]?.[task.id] || {};
    // State now stores answers for each blank ID within each entry ID
    const [answers, setAnswers] = useState<Record<string, Record<string, string>>>(initialAnswers);
    const [isSaved, setIsSaved] = useState(true);

    const handleChange = (entryIndex: number, blankIndex: number, value: string) => {
        const entryId = task.blanks[entryIndex].id;
        const blankId = `${entryId}_${blankIndex}`; // Unique ID for each blank field

        const newEntryAnswers = { ...(answers[entryId] || {}), [blankId]: value };
        const newAnswers = { ...answers, [entryId]: newEntryAnswers };
        
        setAnswers(newAnswers);
        setIsSaved(false); 
    };
    
    const handleSave = () => {
        saveAnswersToLocalStorage(userId, exerciseId, task.id, answers);
        setIsSaved(true);
    };

    const isAnswered = task.blanks.every(entry => {
        const entryAns = answers[entry.id];
        if (!entryAns) return false;
        for (let i = 0; i < entry.numBlanks; i++) {
            if (!entryAns[`${entry.id}_${i}`] || entryAns[`${entry.id}_${i}`].trim() === '') return false;
        }
        return true;
    });

    return (
        <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800">Task (Fill Blanks): {task.title}</h4>
            <p className="text-gray-600 mb-4">{task.description}</p>
            <p className="text-sm text-gray-500 mb-3">Max words per blank: {task.maxWordsPerBlank}</p>
            
            <div className="space-y-4">
                {task.blanks.map((entry, entryIndex) => (
                    <div key={entry.id} className="p-3 border rounded-md bg-gray-50">
                        <p className="text-sm text-gray-700 mb-2">
                            {entry.textBefore} 
                            {/* Render multiple input fields */}
                            {Array.from({ length: entry.numBlanks }).map((_, blankIndex) => (
                                <input
                                    key={`${entry.id}_${blankIndex}`}
                                    type="text"
                                    value={answers[entry.id]?.[`${entry.id}_${blankIndex}`] || ''}
                                    onChange={(e) => handleChange(entryIndex, blankIndex, e.target.value)}
                                    placeholder={`Blank ${blankIndex + 1}`}
                                    className="inline-block w-24 mx-1 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                            ))}
                            {entry.textAfter}
                        </p>
                    </div>
                ))}
            </div>
            <div className="mt-4 border-t pt-3 flex justify-between items-center">
                <button onClick={handleSave} disabled={isSaved} className={`px-4 py-2 ${isSaved ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md transition-colors`}>{isSaved ? 'Answers Saved' : 'Save Answers'}</button>
                <span className={`ml-3 text-sm font-medium ${isAnswered ? 'text-green-700' : 'text-yellow-600'}`}>Status: {isAnswered ? 'All Blanks Filled' : 'Unanswered'}</span>
            </div>
        </div>
    );
};


// --- Q&A / Writing Renderer (remains the same) ---
const QAWritingTaskRenderer: React.FC<TaskRendererProps & { task: QATask | WritingTask }> = ({ task, userId, exerciseId }) => {
    // ... (Q&A/Writing logic with Save button) ...
    const initialAnswers = getInitialAnswers(userId)[exerciseId]?.[task.id] || {};
    const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
    const [isSaved, setIsSaved] = useState(true);
    const isWriting = task.taskType === 'Writing';
    const inputType = isWriting ? 'textarea' : 'text';
    const questionList = isWriting ? [{ id: 'writing_area', value: task.description }] : (task as QATask).questions;
    const requiredLength = isWriting ? (task as WritingTask).minimumWordCount : (task as QATask).maxWordsPerAnswer;
    const handleChange = (questionId: string, value: string) => {
        setAnswers({ ...answers, [questionId]: value });
        setIsSaved(false); 
    };
    const handleSave = () => {
        saveAnswersToLocalStorage(userId, exerciseId, task.id, answers);
        setIsSaved(true);
    };
    const countWords = (text: string) => (text ? text.trim().split(/\s+/).filter(Boolean).length : 0);
    const isAnswered = questionList.every(q => answers[q.id] && countWords(answers[q.id]) >= (isWriting ? requiredLength : 1));
    const wordCountMet = isWriting && answers['writing_area'] ? countWords(answers['writing_area']) >= requiredLength : true;
    const statusText = isWriting ? `Word Count: ${countWords(answers['writing_area'] || '')} / ${requiredLength}` : 'Answered';
    return (
        <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800">Task ({task.taskType}): {task.title}</h4>
            <p className="text-gray-600 mb-4">{task.description}</p>
            <p className="text-sm text-gray-500 mb-3">{isWriting ? `Minimum Word Count: ${requiredLength}` : `Max Words per Answer: ${requiredLength}`}</p>
            <div className="space-y-4">
                {questionList.map((q) => (
                    <div key={q.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{isWriting ? 'Your Response' : `Question: ${q.value}`}</label>
                        {inputType === 'textarea' ? (<textarea value={answers[q.id] || ''} onChange={(e) => handleChange(q.id, e.target.value)} rows={8} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"/>) : (<input type="text" value={answers[q.id] || ''} onChange={(e) => handleChange(q.id, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"/>)}
                        {isWriting && (<p className="text-xs text-gray-500 mt-1">{statusText}</p>)}
                    </div>
                ))}
            </div>
            <div className="mt-4 border-t pt-3 flex justify-between items-center">
                <button onClick={handleSave} disabled={isSaved} className={`px-4 py-2 ${isSaved ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md transition-colors`}>{isSaved ? 'Answers Saved' : 'Save Answers'}</button>
                <span className={`ml-3 text-sm font-medium ${isAnswered && wordCountMet ? 'text-green-700' : 'text-yellow-600'}`}>Status: {isAnswered && wordCountMet ? 'Requirement Met' : 'Unsaved / Incomplete'}</span>
            </div>
        </div>
    );
};


// --- Matching Task Renderer (remains the same) ---
const MatchingTaskRenderer: React.FC<TaskRendererProps & { task: MatchingTask }> = ({ task, userId, exerciseId }) => {
    // ... (Matching logic remains view-only) ...
    return (
        <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-yellow-50 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800">Task (Matching): {task.title}</h4>
            <p className="text-gray-600 mb-4">*Note: Displaying items for review.*</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div><h5 className="font-bold border-b pb-1 mb-1">Group 1 (Headings)</h5><ul className="list-disc pl-5">{task.group1.map(item => <li key={item.id}>{item.value}</li>)}</ul></div>
                <div><h5 className="font-bold border-b pb-1 mb-1">Group 2 (Paragraphs)</h5><ul className="list-disc pl-5">{task.group2.map(item => <li key={item.id}>{item.value}</li>)}</ul></div>
            </div>
        </div>
    );
};


// --- Main Editor Task View (remains the same) ---
const EditorTaskView: React.FC = () => {
    // ... (Main view logic, state, and rendering based on taskType) ...
    const { currentUser, logout } = useAuth();
    const [allExercises] = useState<Exercise[]>(getPersistedExercises); 
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const availableExercises = allExercises;
    const userId = currentUser?.id || 'guest_editor';
    const handleSelectExercise = (exercise: Exercise) => { setSelectedExercise(exercise); };
    const renderExerciseMedia = (exercise: Exercise) => {
        if (exercise.passage) return (<div className="bg-gray-50 p-6 rounded-lg shadow-inner mb-6"><h3 className="text-xl font-semibold mb-3">Reading Passage</h3><div className="whitespace-pre-wrap text-gray-700 text-sm border-l-4 border-blue-400 pl-4 py-1">{exercise.passage}</div></div>);
        if (exercise.recordingUrl) return (<div className="bg-gray-50 p-6 rounded-lg shadow-inner mb-6"><h3 className="text-xl font-semibold mb-3">Listening/Speaking Resource</h3><p className="text-gray-700 text-sm">Recording URL: <a href={exercise.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{exercise.recordingUrl}</a></p><p className="text-sm text-gray-500 mt-1">Please imagine this is an embedded audio player.</p></div>);
        return null;
    }
    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <header className="flex justify-between items-center pb-6 border-b mb-6 bg-white p-4 rounded-lg shadow">
                <h1 className="text-2xl font-bold text-gray-800">IELTS Editor Dashboard</h1>
                <div className="flex items-center">
                    <span className="mr-4 font-semibold text-gray-700">{currentUser?.name || 'Editor'}</span>
                    <button onClick={logout} className="flex items-center text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"><LogoutIcon className="w-5 h-5 mr-1" />Logout</button>
                </div>
            </header>
            <div className="max-w-4xl mx-auto">
                {selectedExercise ? (
                    <div>
                        <button onClick={() => setSelectedExercise(null)} className="mb-4 text-blue-600 hover:text-blue-800 font-medium">&larr; Back to Exercise List</button>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedExercise.title}</h2>
                        <p className="text-gray-500 mb-6">Type: {selectedExercise.exerciseType} | Allowed Time: {selectedExercise.allowedTime} mins</p>
                        {renderExerciseMedia(selectedExercise)}
                        <h3 className="text-2xl font-bold text-gray-800 mt-8 mb-4 border-b pb-2">Exercise Tasks</h3>
                        {selectedExercise.tasks.map(task => {
                            const props = { task: task as Task, userId, exerciseId: selectedExercise.id };
                            switch (task.taskType) {
                                case 'MCQ': return <MCQQuestionRenderer key={task.id} {...props} task={task as MCQTask} />;
                                case 'Filling Blanks': return <FillingBlanksRenderer key={task.id} {...props} task={task as FillingBlanksTask} />;
                                case 'QA': case 'Writing': return <QAWritingTaskRenderer key={task.id} {...props} task={task as QATask | WritingTask} />;
                                case 'Matching': return <MatchingTaskRenderer key={task.id} {...props} task={task as MatchingTask} />;
                                default: return null;
                            }
                        })}
                    </div>
                ) : (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">Available Exercises</h2>
                        <div className="space-y-3">
                            {availableExercises.length > 0 ? availableExercises.map(ex => (
                                <div key={ex.id} className="p-3 border rounded-md flex justify-between items-center hover:bg-gray-50 transition-colors">
                                    <div><p className="font-semibold text-gray-700">{ex.title}</p><p className="text-sm text-gray-500">Type: {ex.exerciseType} | Tasks: {ex.tasks.length}</p></div>
                                    <button onClick={() => handleSelectExercise(ex)} className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700">Start Exercise</button>
                                </div>
                            )) : <p className="text-gray-500">No exercises available.</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditorTaskView;