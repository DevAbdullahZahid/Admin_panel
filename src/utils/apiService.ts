// src/utils/apiService.ts

// Use environment variable for API base URL  
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// --- Authentication Helpers ---

const getToken = (): string | null => {
    return localStorage.getItem('authToken');
};

export const setToken = (token: string): void => {
    localStorage.setItem('authToken', token);
};

export const removeToken = (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
};

// --- Response Handler Helper ---

const handleResponse = async (response: Response) => {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    let data;
    try {
        data = isJson ? await response.json() : await response.text();
    } catch (err) {
        data = null;
    }

    if (!response.ok) {
        if (response.status === 401) {
            removeToken();
        }

        // Extract detailed error message from API response
        // Handle both string and array error messages
        let errorMessage = response.statusText || `HTTP ${response.status}`;

        if (data?.message) {
            if (Array.isArray(data.message)) {
                // Join array messages with newlines
                errorMessage = data.message.join('\n');
            } else if (typeof data.message === 'object') {
                errorMessage = JSON.stringify(data.message);
            } else {
                errorMessage = String(data.message);
            }
        } else if (data?.error) {
            errorMessage = typeof data.error === 'object' ? JSON.stringify(data.error) : String(data.error);
        } else if (data?.detail) {
            errorMessage = typeof data.detail === 'object' ? JSON.stringify(data.detail) : String(data.detail);
        }

        // Log the full error for debugging
        console.error('[API Error]', {
            status: response.status,
            statusText: response.statusText,
            message: errorMessage,
            fullResponse: data
        });

        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).data = data;
        throw error;
    }

    return data;
};

// --- Main Fetch Function ---

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = getToken();

    // Don't set Content-Type for FormData - browser will set it automatically with boundary
    const isFormData = options.body instanceof FormData;

    const headers: HeadersInit = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const config: RequestInit = {
        ...options,
        headers,
        credentials: 'omit',
    };

    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const response = await fetch(`${API_BASE_URL}${path}`, config);

    return handleResponse(response);
};