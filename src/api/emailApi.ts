// src/api/emailApi.ts
import { apiFetch } from '../utils/apiService';

// ===================================
// TYPESCRIPT INTERFACES
// ===================================

export interface EmailConfig {
    id?: number;
    config_id?: string;
    provider: string;
    from_email: string;
    from_name: string;
    provider_config: string; // JSON string
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface CreateEmailConfigPayload {
    provider: string;
    from_email: string;
    from_name: string;
    provider_config: string; // JSON string
}

export interface UpdateEmailConfigPayload {
    provider?: string;
    from_email?: string;
    from_name?: string;
    provider_config?: string; // JSON string
}

export interface EmailTemplate {
    template_id: string;
    config_id: string;
    name: string;
    subject: string;
    email_type: string;
    html_template: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface CreateEmailTemplatePayload {
    config_id: string;
    name: string;
    subject: string;
    email_type: string;
    html_template: string;
    is_active?: boolean;
}

export interface UpdateEmailTemplatePayload {
    config_id?: string;
    name?: string;
    subject?: string;
    email_type?: string;
    html_template?: string;
    is_active?: boolean;
}

export interface EmailVariable {
    variable_name: string;
    description: string;
    example_value?: string;
}

export interface EmailLog {
    log_id: string;
    recipient_email: string;
    subject: string;
    email_type: string;
    status: 'sent' | 'failed';
    error_message?: string;
    sent_at?: string;
    created_at?: string;
}

// ===================================
// EMAIL CONFIG API FUNCTIONS
// ===================================

/**
 * Get all email configurations
 */
export const getConfigs = async (): Promise<EmailConfig[]> => {
    const response = await apiFetch('/email/configs', { method: 'GET' });

    let configs: any[] = [];

    // Handle different response formats
    if (Array.isArray(response)) {
        configs = response;
    } else if (response?.data?.configs && Array.isArray(response.data.configs)) {
        // API returns {data: {configs: [...]}}
        configs = response.data.configs;
    } else if (Array.isArray(response?.data)) {
        configs = response.data;
    } else if (Array.isArray(response?.configs)) {
        configs = response.configs;
    }

    // Normalize configs: API returns 'id' but we use 'config_id'
    return configs.map(config => ({
        ...config,
        config_id: config.config_id || String(config.id)
    }));
};

/**
 * Get a single email configuration by ID
 */
export const getConfigById = async (configId: string): Promise<EmailConfig> => {
    const response = await apiFetch(`/email/configs/${configId}`, { method: 'GET' });
    return response?.data || response;
};

/**
 * Create a new email configuration
 */
export const createConfig = async (payload: CreateEmailConfigPayload): Promise<EmailConfig> => {
    const token = localStorage.getItem('authToken');

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/email/configs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'accept': 'application/json',
            'authorization': `Bearer ${token}`,
        },
        body: new URLSearchParams({
            provider: payload.provider,
            from_email: payload.from_email,
            from_name: payload.from_name,
            provider_config: payload.provider_config,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create config' }));
        throw new Error(error.message || 'Failed to create config');
    }

    const data = await response.json();
    console.log('Config created:', data);
    return data?.data || data;
};

/**
 * Update an existing email configuration
 */
export const updateConfig = async (
    configId: string,
    payload: UpdateEmailConfigPayload
): Promise<EmailConfig> => {
    const response = await apiFetch(`/email/configs/${configId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
    return response?.data || response;
};

/**
 * Delete an email configuration
 */
export const deleteConfig = async (configId: string): Promise<void> => {
    await apiFetch(`/email/configs/${configId}`, { method: 'DELETE' });
};

/**
 * Send a test email using a specific configuration
 */
export const sendTestEmail = async (configId: string, recipientEmail: string): Promise<any> => {
    const token = localStorage.getItem('authToken');

    const formData = new URLSearchParams({
        config_id: configId,
        recipient_email: recipientEmail,
    });

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/email/send-test-email`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'accept': 'application/json',
            'authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to send test email' }));
        throw new Error(error.message || 'Failed to send test email');
    }

    const data = await response.json();
    console.log('Test email sent:', data);
    return data;
};

// ===================================
// EMAIL TEMPLATE API FUNCTIONS
// ===================================

/**
 * Get all email templates
 */
export const getTemplates = async (): Promise<EmailTemplate[]> => {
    const response = await apiFetch('/email/templates', { method: 'GET' });

    // Handle different response formats
    if (Array.isArray(response)) return response;
    if (response?.data?.templates && Array.isArray(response.data.templates)) {
        // API returns {data: {templates: [...]}}
        return response.data.templates;
    }
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.templates)) return response.templates;
    return [];
};

/**
 * Get a single email template by ID
 */
export const getTemplateById = async (templateId: string): Promise<EmailTemplate> => {
    const response = await apiFetch(`/email/templates/${templateId}`, { method: 'GET' });
    return response?.data || response;
};

/**
 * Create a new email template
 */
export const createTemplate = async (payload: CreateEmailTemplatePayload): Promise<EmailTemplate> => {
    const token = localStorage.getItem('authToken');

    const formData = new URLSearchParams({
        config_id: payload.config_id,
        name: payload.name,
        subject: payload.subject,
        email_type: payload.email_type,
        html_template: payload.html_template,
    });

    if (payload.is_active !== undefined) {
        formData.append('is_active', String(payload.is_active));
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/email/templates`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'accept': 'application/json',
            'authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create template' }));
        throw new Error(error.message || 'Failed to create template');
    }

    const data = await response.json();
    console.log('Template created:', data);
    return data?.data || data;
};

/**
 * Update an existing email template
 */
export const updateTemplate = async (
    templateId: string,
    payload: UpdateEmailTemplatePayload
): Promise<EmailTemplate> => {
    const response = await apiFetch(`/email/templates/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
    return response?.data || response;
};

/**
 * Delete an email template
 */
export const deleteTemplate = async (templateId: string): Promise<void> => {
    await apiFetch(`/email/templates/${templateId}`, { method: 'DELETE' });
};

// ===================================
// EMAIL VARIABLES API FUNCTIONS
// ===================================

/**
 * Get available variables for a specific email type
 */
export const getVariablesByType = async (emailType: string): Promise<EmailVariable[]> => {
    const response = await apiFetch(`/email/variables/${emailType}`, { method: 'GET' });
    // Handle different response formats
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.variables)) return response.variables;
    return [];
};

// ===================================
// EMAIL LOGS API FUNCTIONS
// ===================================

/**
 * Get all email logs
 */
export const getLogs = async (): Promise<EmailLog[]> => {
    const response = await apiFetch('/email/logs', { method: 'GET' });
    // Handle different response formats
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.logs)) return response.logs;
    return [];
};

/**
 * Get a single email log by ID
 */
export const getLogById = async (logId: string): Promise<EmailLog> => {
    const response = await apiFetch(`/email/logs/${logId}`, { method: 'GET' });
    return response?.data || response;
};
