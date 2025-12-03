// src/pages/EmailConfigs.tsx
import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '../components/icons';
import EmailConfigForm from '../components/email/EmailConfigForm';
import {
    EmailConfig,
    CreateEmailConfigPayload,
    UpdateEmailConfigPayload,
    getConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
    sendTestEmail,
} from '../api/emailApi';

const EmailConfigs: React.FC = () => {
    const [configs, setConfigs] = useState<EmailConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingConfig, setEditingConfig] = useState<EmailConfig | undefined>(undefined);

    // Fetch configs on mount
    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getConfigs();
            setConfigs(data);
        } catch (err: any) {
            console.error('Failed to load configs:', err);
            setError(err.message || 'Failed to load email configurations');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveConfig = async (
        payload: CreateEmailConfigPayload | UpdateEmailConfigPayload,
        configId?: string
    ): Promise<boolean> => {
        setError(null);
        setSuccess(null);
        try {
            if (configId) {
                await updateConfig(configId, payload as UpdateEmailConfigPayload);
                setSuccess('Email configuration updated successfully!');
            } else {
                await createConfig(payload as CreateEmailConfigPayload);
                setSuccess('Email configuration created successfully!');
            }
            await loadConfigs();
            setIsModalOpen(false);
            setEditingConfig(undefined);
            return true;
        } catch (err: any) {
            console.error('Failed to save config:', err);
            setError(err.message || 'Failed to save email configuration');
            return false;
        }
    };

    const handleDeleteConfig = async (config: EmailConfig) => {
        if (!window.confirm(`Delete configuration "${config.from_name}"?`)) return;

        setError(null);
        setSuccess(null);
        try {
            await deleteConfig(config.config_id);
            setSuccess('Email configuration deleted successfully!');
            await loadConfigs();
        } catch (err: any) {
            console.error('Failed to delete config:', err);
            setError(err.message || 'Failed to delete email configuration');
        }
    };

    const openEditModal = (config: EmailConfig) => {
        setEditingConfig(config);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingConfig(undefined);
    };

    const handleTestEmail = async (config: EmailConfig) => {
        const email = prompt('Enter recipient email address for test:');
        if (!email) return;

        setError(null);
        setSuccess(null);
        try {
            await sendTestEmail(config.config_id!, email);
            setSuccess(`Test email sent successfully to ${email}!`);
        } catch (err: any) {
            console.error('Failed to send test email:', err);
            setError(err.message || 'Failed to send test email');
        }
    };

    // Parse provider_config safely
    const parseProviderConfig = (configStr: string) => {
        try {
            return JSON.parse(configStr);
        } catch {
            return null;
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Email Configurations</h1>
                    <p className="text-gray-500 mt-1">Manage email provider settings and configurations</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Configuration
                </button>
            </div>

            {/* Toast Messages */}
            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="font-bold">
                        ×
                    </button>
                </div>
            )}
            {success && (
                <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg flex justify-between">
                    <span>{success}</span>
                    <button onClick={() => setSuccess(null)} className="font-bold">
                        ×
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Provider
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                From Name / Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Configuration
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-10">
                                    Loading configurations...
                                </td>
                            </tr>
                        ) : configs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-10 text-gray-500">
                                    No email configurations found. Create one to get started.
                                </td>
                            </tr>
                        ) : (
                            configs.map((config) => {
                                const providerConfig = parseProviderConfig(config.provider_config);
                                return (
                                    <tr key={config.config_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                {config.provider}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{config.from_name}</div>
                                            <div className="text-sm text-gray-500">{config.from_email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {providerConfig ? (
                                                <div className="text-sm">
                                                    {providerConfig.token ? (
                                                        <>
                                                            <div className="text-gray-900">Token: {providerConfig.token.substring(0, 8)}...</div>
                                                            {providerConfig.region && <div className="text-gray-500">Region: {providerConfig.region}</div>}
                                                        </>
                                                    ) : providerConfig.smtp_host ? (
                                                        <>
                                                            <div className="text-gray-900">{providerConfig.smtp_host}</div>
                                                            <div className="text-gray-500">
                                                                Port: {providerConfig.smtp_port}
                                                                {providerConfig.use_tls && <span className="ml-2 text-blue-600">TLS</span>}
                                                                {providerConfig.use_ssl && <span className="ml-2 text-green-600">SSL</span>}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">No config details</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">Invalid config</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full ${config.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                {config.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <button
                                                onClick={() => handleTestEmail(config)}
                                                className="mr-3 text-green-600 hover:text-green-900"
                                                title="Send test email"
                                            >
                                                📧 Test
                                            </button>
                                            <button
                                                onClick={() => openEditModal(config)}
                                                className="mr-3 text-indigo-600 hover:text-indigo-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteConfig(config)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <TrashIcon className="w-5 h-5 inline" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <EmailConfigForm
                isOpen={isModalOpen}
                onClose={closeModal}
                onSubmit={handleSaveConfig}
                editingConfig={editingConfig}
            />
        </div>
    );
};

export default EmailConfigs;
