// src/pages/EmailTemplates.tsx
import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '../components/icons';
import EmailTemplateForm from '../components/email/EmailTemplateForm';
import {
    EmailTemplate,
    CreateEmailTemplatePayload,
    UpdateEmailTemplatePayload,
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
} from '../api/emailApi';

const EmailTemplates: React.FC = () => {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getTemplates();
            console.log('Loaded templates:', data);
            if (data.length > 0) {
                console.log('First template structure:', data[0]);
            }
            setTemplates(data);
        } catch (err: any) {
            console.error('Failed to load templates:', err);
            setError(err.message || 'Failed to load email templates');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveTemplate = async (
        payload: CreateEmailTemplatePayload | UpdateEmailTemplatePayload,
        templateId?: string
    ): Promise<boolean> => {
        setError(null);
        setSuccess(null);
        try {
            if (templateId) {
                await updateTemplate(templateId, payload as UpdateEmailTemplatePayload);
                setSuccess('Email template updated successfully!');
            } else {
                await createTemplate(payload as CreateEmailTemplatePayload);
                setSuccess('Email template created successfully!');
            }
            await loadTemplates();
            setIsModalOpen(false);
            setEditingTemplate(undefined);
            return true;
        } catch (err: any) {
            console.error('Failed to save template:', err);
            setError(err.message || 'Failed to save email template');
            return false;
        }
    };

    const handleDeleteTemplate = async (template: EmailTemplate) => {
        if (!window.confirm(`Delete template "${template.name}"?`)) return;

        setError(null);
        setSuccess(null);
        try {
            await deleteTemplate(template.template_id);
            setSuccess('Email template deleted successfully!');
            await loadTemplates();
        } catch (err: any) {
            console.error('Failed to delete template:', err);
            setError(err.message || 'Failed to delete email template');
        }
    };

    const openEditModal = (template: EmailTemplate) => {
        setEditingTemplate(template);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTemplate(undefined);
    };

    // SAFE filter (prevents crashes)
    const filteredTemplates = templates.filter((template) => {
        const term = searchQuery.toLowerCase();
        return (
            (template.name ?? '').toLowerCase().includes(term) ||
            (template.subject ?? '').toLowerCase().includes(term) ||
            (template.email_type ?? '').toLowerCase().includes(term)
        );
    });

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Email Templates</h1>
                    <p className="text-gray-500 mt-1">Create and manage email templates with dynamic variables</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Create Template
                </button>
            </div>

            {/* Toast Messages */}
            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="font-bold">×</button>
                </div>
            )}
            {success && (
                <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg flex justify-between">
                    <span>{success}</span>
                    <button onClick={() => setSuccess(null)} className="font-bold">×</button>
                </div>
            )}

            {/* Search */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search templates by name, subject, or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                />
            </div>

            {/* Table */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Template Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Subject
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Email Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Created
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="text-center py-10">
                                    Loading templates...
                                </td>
                            </tr>
                        ) : filteredTemplates.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-10 text-gray-500">
                                    {searchQuery
                                        ? 'No templates match your search.'
                                        : 'No email templates found. Create one to get started.'}
                                </td>
                            </tr>
                        ) : (
                            filteredTemplates.map((template) => (
                                <tr key={template.template_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {template.name ?? 'Untitled'}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 max-w-xs truncate">
                                            {template.subject ?? 'No subject'}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">
                                            {template.email_type
                                                ? template.email_type.charAt(0).toUpperCase() +
                                                template.email_type.slice(1).replace('_', ' ')
                                                : 'Unknown'}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${template.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {template.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {template.created_at
                                            ? new Date(template.created_at).toLocaleDateString()
                                            : '—'}
                                    </td>

                                    <td className="px-6 py-4 text-sm">
                                        <button
                                            onClick={() => openEditModal(template)}
                                            className="mr-3 text-indigo-600 hover:text-indigo-900"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTemplate(template)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <TrashIcon className="w-5 h-5 inline" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <EmailTemplateForm
                isOpen={isModalOpen}
                onClose={closeModal}
                onSubmit={handleSaveTemplate}
                editingTemplate={editingTemplate}
            />
        </div>
    );
};

export default EmailTemplates;
