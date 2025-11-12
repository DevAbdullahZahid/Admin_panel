// src/hooks/useAuth.tsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, PortalUserRole } from '../types';
import { logActivity } from '../utils/activityLogger';
// Import our new API helpers
import { apiFetch, setToken, removeToken } from '../utils/apiService';

// --- (NEW) Helper function to standardize roles ---
const normalizeRole = (role: string): PortalUserRole => {
  if (!role) return 'User'; // Default to 'User' if role is missing
  const lowerRole = role.toLowerCase();
  
  switch (lowerRole) {
    case 'superadmin':
      return 'SuperAdmin';
    case 'admin':
      return 'Admin';
    case 'editor':
      return 'Editor';
    case 'user':
      return 'User';
    default:
      return 'User'; // Safely default any unknown roles
  }
};
// --------------------------------------------------


interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<true>; // Throws error on fail
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true

  // This function checks if a token exists and fetches the user
  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/users/me', { method: 'GET' });
      if (!response.ok) throw new Error('Not authenticated');
      const userData = await response.json();
      
      const user: User = {
        id: userData.id,
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        role: normalizeRole(userData.role), // <-- (FIX APPLIED HERE)
        isActive: userData.isActive,
      };

      setCurrentUser(user);

    } catch (error) {
      setCurrentUser(null);
      removeToken(); // Clear any invalid token
    } finally {
      setIsLoading(false);
    }
  };

  // On app load, run the auth check
  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<true> => {
  try {
    const response = await fetch(
      'https://dev-api-iprep.rezotera.com/api/v1/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }
    );

    const result = await response.json();

    // Handle non-200 or non-successful responses
    if (result.code !== 200 || result.status !== 'success') {
      throw new Error(result.message || 'Login failed. Please check your credentials.');
    }

    // ✅ Correctly extract token and user
    const token = result.data?.token;
    const userFromLogin = result.data?.user;

    if (!token) throw new Error('Login successful, but no auth token was provided.');
    if (!userFromLogin) throw new Error('Login successful, but no user object was provided.');

    // 1. Save the token securely
    setToken(token);

    // 2. Normalize and prepare user for React Context
    const userForContext: User = {
      id: userFromLogin.id,
      name: `${userFromLogin.firstName} ${userFromLogin.lastName}`,
      email: userFromLogin.email,
      role: normalizeRole(userFromLogin.role),
      isActive: userFromLogin.isActive,
    };

    // 3. Set in state
    setCurrentUser(userForContext);

    // 4. Log activity (for audit / analytics)
    logActivity('logged in', userForContext.name);

    return true;
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Something went wrong during login.');
  }
};


  const logout = () => {
    if (currentUser) {
      logActivity(`logged out`, currentUser.name);
    }
    setCurrentUser(null);
    removeToken();
    window.location.href = '/';
  };

  const value = { currentUser, login, logout, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};