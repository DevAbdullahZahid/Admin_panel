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
      const response = await fetch('https://api-iprep.rezotera.com/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = 'Login failed. Please try again.';
        try {
          const errorData = await response.json();
          if (errorData && errorData.detail) { 
            errorMessage = errorData.detail;
          } else {
            errorMessage = `Error ${response.status}: ${response.statusText}`;
          }
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      const token = data.token;
      const userFromLogin = data.user;
      
      if (!token) throw new Error('Login successful, but no auth token was provided.');
      if (!userFromLogin) throw new Error('Login successful, but no user object was provided.');
      
      // 1. Save the token
      setToken(token);

      // 2. Convert the user object
      const userForContext: User = {
        id: userFromLogin.id,
        name: `${userFromLogin.firstName} ${userFromLogin.lastName}`,
        email: userFromLogin.email,
        role: normalizeRole(userFromLogin.role), // <-- (FIX APPLIED HERE)
        isActive: userFromLogin.isActive,
      };

      // 3. Set the current user in state
      setCurrentUser(userForContext);
      
      // 4. Log activity
      logActivity(`logged in`, userForContext.name);

      return true; // Return true on success

    } catch (error) {
      console.error('Login error:', error);
      throw error;
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