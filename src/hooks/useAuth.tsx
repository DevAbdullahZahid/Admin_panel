// src/hooks/useAuth.tsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, PortalUserRole } from '../types';
import { logActivity } from '../utils/activityLogger';
import { apiFetch, setToken, removeToken } from '../utils/apiService';

// Helper function to standardize roles
const normalizeRole = (role: string): PortalUserRole => {
  if (!role) return 'User';
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
      return 'User';
  }
};

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<true>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if a token exists and fetch the user
  const checkAuth = async () => {
    setIsLoading(true);
    try {
      // First check if we have a token - if not, skip the API call
      const token = localStorage.getItem('authToken');
      if (!token) {
        setCurrentUser(null);
        setIsLoading(false);
        return;
      }

      // apiFetch returns parsed data directly, not Response object
      const userData = await apiFetch('/users/me', { method: 'GET' });

      const user: User = {
        id: userData.id,
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        role: normalizeRole(userData.role),
        isActive: userData.isActive,
      };

      setCurrentUser(user);
    } catch (error) {
      console.error('Authentication check failed:', error);
      setCurrentUser(null);
      removeToken();
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
      // Use apiFetch for consistency
      const result = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Handle non-200 or non-successful responses
      if (result.code !== 200 || result.status !== 'success') {
        throw new Error(result.message || 'Login failed. Please check your credentials.');
      }

      // Extract token and user
      const token = result.data?.token;
      const userFromLogin = result.data?.user;

      if (!token) throw new Error('Login successful, but no auth token was provided.');
      if (!userFromLogin) throw new Error('Login successful, but no user object was provided.');

      // Save the token
      setToken(token);

      // Normalize and prepare user for React Context
      const userForContext: User = {
        id: userFromLogin.id,
        name: `${userFromLogin.firstName} ${userFromLogin.lastName}`,
        email: userFromLogin.email,
        role: normalizeRole(userFromLogin.role),
        isActive: userFromLogin.isActive,
      };

      // Set in state
      setCurrentUser(userForContext);

      // Log activity for audit
      logActivity('logged in', userForContext.name);

      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Something went wrong during login.');
    }
  };

  const logout = () => {
    if (currentUser) {
      logActivity('logged out', currentUser.name);
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