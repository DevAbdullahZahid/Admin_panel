// src/types.ts

// ===================================
// AUTH/ADMIN USER TYPE (Portal Login)
// ===================================
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

// ... (Exercise types remain unchanged) ...
export type ExerciseType = 'Reading' | 'Writing' | 'Listening' | 'Speaking';
export type TaskType = 'Matching' | 'Filling Blanks' | 'MCQ' | 'QA' | 'Writing';
export interface BaseTask { /* ... */ }
export interface MatchingTask extends BaseTask { /* ... */ }
export interface FillingBlanksTask extends BaseTask { /* ... */ }
export interface MCQTask extends BaseTask { /* ... */ }
export interface QATask extends BaseTask { /* ... */ }
export interface WritingTask extends BaseTask { /* ... */ }
export type Task = MatchingTask | FillingBlanksTask | MCQTask | QATask | WritingTask;
export interface Exercise { /* ... */ }