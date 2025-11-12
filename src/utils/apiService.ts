// src/utils/apiService.ts

// The base URL of your deployed API
const API_BASE_URL = 'https://dev-api-iprep.rezotera.com/api/v1';

/**
 * Gets the auth token from localStorage.
 */
const getToken = (): string | null => {
  return localStorage.getItem('authToken');
};

/**
 * Sets the auth token in localStorage.
 */
export const setToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

/**
 * Removes the auth token from localStorage.
 */
export const removeToken = (): void => {
  localStorage.removeItem('authToken');
};

/**
 * A wrapper for the native fetch function that automatically adds
 * the Authorization header and the base URL.
 *
 * @param endpoint The API endpoint (e.g., '/users/me')
 * @param options The standard fetch options (method, body, etc.)
 * @returns A Promise that resolves with the server's response
 */
export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  
  headers.append('Content-Type', 'application/json');

  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // --- (THIS IS THE FIX) ---
  // We no longer force a redirect here.
  // We will let the useAuth hook handle the 401 error.
  if (response.status === 401) {
    removeToken();
    // window.location.href = '/';  <-- DELETED THIS LINE
  }
  // --- END OF FIX ---

  return response;
};