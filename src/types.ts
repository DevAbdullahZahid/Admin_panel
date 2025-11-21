// src/types.ts

// ===================================
// TASK TYPES
// ===================================

export type ExerciseType = 'Reading' | 'Writing' | 'Listening' | 'Speaking';
export type TaskType = 'Matching' | 'Filling Blanks' | 'MCQ' | 'QA' | 'Writing' | 'Speaking';

export interface BaseTask {
  id: string; // Local UUID
  apiId?: number; // API's task_id (for updates)
  taskType: TaskType;
  title: string;
  description: string;
  allowedTime: number;
}

export interface MatchingTask extends BaseTask {
  taskType: 'Matching';
  group1: { value: string; id?: string }[];
  group2: { value: string; id?: string }[];
  answers?: string[];
}

export interface FillingBlanksTask extends BaseTask {
  taskType: 'Filling Blanks';
  maxWordsPerBlank?: number;
  blanks: {
    id?: string;
    questionText?: string;
    textBefore?: string;
    textAfter?: string;
    numBlanks?: number;
    correctAnswer?: string; // Comma-separated string from form
    correctAnswers?: string[]; // Array for API
    position?: number;
  }[];
}

export interface MCQTask extends BaseTask {
  taskType: 'MCQ';
  allowMultipleSelections?: boolean;
  questions: {
    id?: string;
    questionText: string;
    options: {
      id?: string;
      value: string;
      isCorrect?: boolean;
    }[];
  }[];
}

export interface QATask extends BaseTask {
  taskType: 'QA';
  maxWordsPerAnswer?: number;
  minimumWordCount?: number;
  questions: {
    id?: string;
    value: string;
  }[];
  answers?: string[];
}

export interface WritingTask extends BaseTask {
  taskType: 'Writing';
  minimumWordCount?: number;
  maxWords?: number;
  questions?: {
    id?: string;
    value?: string;
    questionText?: string;
  }[];
}

export interface SpeakingTask extends BaseTask {
  taskType: 'Speaking';
  questions?: {
    id?: string;
    value?: string;
    questionText?: string;
  }[];
}

export type PortalUserRole = 'SuperAdmin' | 'Admin' | 'Editor' | 'User';

// This User interface is what our 'currentUser' in useAuth will look like
// It's based on the /me endpoint
export interface User {
  id: string;
  name: string; // The API might send firstName/lastName, we'll combine them
  email: string;
  role: PortalUserRole;
  isActive: boolean; // Added for Active/Inactive
}
export interface Module {
  module_id: number; // Changed from 'id'
  type: string;
  description: string;
  isActive?: boolean;
}
// Also update Exercise:
export interface Exercise {
  id: string; // Exercise ID can remain string
  moduleId: number; // Ensure this is number and matches Module.module_id
  // ... other fields
}

// ===================================
// APPLICATION USER TYPES (Managed Users)
// ===================================
export type AppUserRole = 'SuperAdmin' | 'Admin' | 'Editor' | 'User';

// This is the full user object from the API (e.g., from GET /api/v1/users)
// --- THIS IS AN ASSUMPTION ---
// You MUST update this to match your API's schema
export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string; // Password should not be sent from the API
  role: AppUserRole;
  isActive: boolean; // Added for Active/Inactive status
  referralCode: string;
  referredBy?: string;
  discountAmount: number | null;
  createdBy: string;
  createdAt: string;
  editedBy?: string;
  editedAt?: string;
  deletedBy?: string;
  deletedAt?: string;
}

// Task union type - includes all task types
export type Task = MatchingTask | FillingBlanksTask | MCQTask | QATask | WritingTask | SpeakingTask;