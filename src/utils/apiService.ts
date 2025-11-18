// src/utils/apiService.ts - FINAL PRODUCTION VERSION

const API_BASE_URL = 'https://dev-api-iprep.rezotera.com/api/v1';

const getToken = (): string | null => {
    return localStorage.getItem('authToken');
};

export const setToken = (token: string): void => {
    localStorage.setItem('authToken', token);
};

export const removeToken = (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user'); // optional: clear user too
};

// Helper: Automatically parse JSON and handle errors
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
        // 401 → let useAuth handle it (don't redirect here)
        if (response.status === 401) {
            removeToken();
            // Don't redirect — let your auth context do it
        }

        const errorMessage = data?.message || data?.error || response.statusText;
        throw new Error(errorMessage || `HTTP ${response.status}`);
    }

    return data;
};

export const apiFetch = async (
    endpoint: string,
    options: RequestInit = {}
): Promise<any> => {
    const token = getToken();
    const headers = new Headers(options.headers || {});

    // FIX: Use .set() to prevent duplicate Content-Type headers
    // Only set JSON if the body is present (POST/PUT) and is not FormData (for file uploads).
    if (options.body && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    return handleResponse(response);
};