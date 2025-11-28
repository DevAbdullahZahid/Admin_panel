// src/components/email/EmailTemplateForm.tsx
import React, { useState, useEffect } from 'react';
import {
    EmailTemplate,
    CreateEmailTemplatePayload,
    UpdateEmailTemplatePayload,
    EmailVariable,
    EmailConfig,
    getVariablesByType,
    getConfigs,
} from '../../api/emailApi';

interface EmailTemplateFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: CreateEmailTemplatePayload | UpdateEmailTemplatePayload, templateId?: string) => Promise<boolean>;
    editingTemplate?: EmailTemplate;
}

const EmailTemplateForm: React.FC<EmailTemplateFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    editingTemplate,
}) => {
    const [formData, setFormData] = useState({
        config_id: '',
        name: '',
        subject: '',
        email_type: '',
        html_template: '',
        is_active: true,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [variables, setVariables] = useState<EmailVariable[]>([]);
    const [loadingVariables, setLoadingVariables] = useState(false);
    const [configs, setConfigs] = useState<EmailConfig[]>([]);
    const [loadingConfigs, setLoadingConfigs] = useState(false);

    // Common email types (you can customize this list)
    const emailTypes = [
        'welcome',
        'password_reset',
        'verification',
        'notification',
        'promotional',
        'transactional',
        'reminder',
        'confirmation',
    ];

    // Load configs on mount
    useEffect(() => {
        if (isOpen) {
            loadEmailConfigs();
        }
    }, [isOpen]);

    const loadEmailConfigs = async () => {
        setLoadingConfigs(true);
        try {
            const configList = await getConfigs();
            setConfigs(configList);
            // Auto-select first config if creating new template
            if (!editingTemplate && configList.length > 0) {
                setFormData(prev => ({ ...prev, config_id: configList[0].config_id }));
            }
        } catch (error) {
            console.error('Failed to load configs:', error);
        } finally {
            setLoadingConfigs(false);
        }
    };

    useEffect(() => {
        if (editingTemplate) {
            setFormData({
                config_id: editingTemplate.config_id,
                name: editingTemplate.name,
                subject: editingTemplate.subject,
                email_type: editingTemplate.email_type,
                html_template: editingTemplate.html_template,
                is_active: editingTemplate.is_active,
            });
        } else {
            setFormData({
                config_id: configs.length > 0 ? configs[0].config_id : '',
                name: '',
                subject: '',
                email_type: '',
                html_template: '',
                is_active: true,
            });
        }
    }, [editingTemplate, isOpen]);

    // Fetch variables when email type changes
    useEffect(() => {
        if (formData.email_type) {
            fetchVariables(formData.email_type);
        } else {
            setVariables([]);
        }
    }, [formData.email_type]);

    const fetchVariables = async (emailType: string) => {
        setLoadingVariables(true);
        try {
            const vars = await getVariablesByType(emailType);
            setVariables(vars);
        } catch (error) {
            console.error('Failed to fetch variables:', error);
            setVariables([]);
        } finally {
            setLoadingVariables(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const success = await onSubmit(formData, editingTemplate?.template_id);
            if (success) {
                onClose();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const insertVariable = (variableName: string) => {
        const variable = `{{${variableName}}}`;
        const textarea = document.getElementById('html_template') as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = formData.html_template;
            const newText = text.substring(0, start) + variable + text.substring(end);
            setFormData({ ...formData, html_template: newText });

            // Set cursor position after inserted variable
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + variable.length, start + variable.length);
            }, 0);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        {editingTemplate ? 'Edit Email Template' : 'Create Email Template'}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left Column */}
                            <div className="space-y-4">
                                {/* Email Config */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Configuration *
                                    </label>
                                    <select
                                        required
                                        value={formData.config_id}
                                        onChange={(e) => setFormData({ ...formData, config_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={loadingConfigs}
                                    >
                                        <option value="">Select email config</option>
                                        {configs.map((config) => (
                                            <option key={config.config_id} value={config.config_id}>
                                                {config.from_name} ({config.from_email})
                                            </option>
                                        ))}
                                    </select>
                                    {configs.length === 0 && !loadingConfigs && (
                                        <p className="text-xs text-red-600 mt-1">
                                            No email configs found. Please create one first.
                                        </p>
                                    )}
                                </div>

                                {/* Template Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Template Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Welcome Email"
                                    />
                                </div>

                                {/* Email Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Type *
                                    </label>
                                    <select
                                        required
                                        value={formData.email_type}
                                        onChange={(e) => setFormData({ ...formData, email_type: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select email type</option>
                                        {emailTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Subject *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Welcome to our platform!"
                                    />
                                </div>

                                {/* Active Checkbox */}
                                <div>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="mr-2"
                                        />
                                        <span className="text-sm text-gray-700">Active</span>
                                    </label>
                                </div>

                                {/* Available Variables */}
                                {formData.email_type && (
                                    <div className="border border-gray-300 rounded-md p-3">
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">
                                            Available Variables
                                            {loadingVariables && <span className="ml-2 text-xs text-gray-500">(Loading...)</span>}
                                        </h3>
                                        <div className="space-y-1 max-h-40 overflow-y-auto">
                                            {variables.length > 0 ? (
                                                variables.map((variable) => (
                                                    <div
                                                        key={variable.variable_name}
                                                        className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded hover:bg-gray-100"
                                                    >
                                                        <div>
                                                            <code className="text-blue-600">{'{{' + variable.variable_name + '}}'}</code>
                                                            <p className="text-gray-600 text-xs">{variable.description}</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => insertVariable(variable.variable_name)}
                                                            className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded"
                                                        >
                                                            Insert
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-gray-500">
                                                    {loadingVariables ? 'Loading variables...' : 'No variables available for this email type'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column - HTML Body */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    HTML Body *
                                </label>
                                <textarea
                                    id="html_template"
                                    required
                                    value={formData.html_template}
                                    onChange={(e) => setFormData({ ...formData, html_template: e.target.value })}
                                    className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                    placeholder="<html>&#10;  <body>&#10;    <h1>Hello {{user_name}}!</h1>&#10;  </body>&#10;</html>"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Use variables like {'{{variable_name}}'} in your HTML
                                </p>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || configs.length === 0}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Saving...' : editingTemplate ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EmailTemplateForm;
