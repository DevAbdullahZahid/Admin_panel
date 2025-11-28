// src/components/email/EmailConfigForm.tsx
import React, { useState, useEffect } from 'react';
import { EmailConfig, CreateEmailConfigPayload, UpdateEmailConfigPayload } from '../../api/emailApi';

interface EmailConfigFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: CreateEmailConfigPayload | UpdateEmailConfigPayload, configId?: string) => Promise<boolean>;
    editingConfig?: EmailConfig;
}

const EmailConfigForm: React.FC<EmailConfigFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    editingConfig,
}) => {
    const [formData, setFormData] = useState({
        smtp_host: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_password: '',
        from_email: '',
        from_name: '',
        use_tls: true,
        use_ssl: false,
        is_active: true,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingConfig) {
            setFormData({
                smtp_host: editingConfig.smtp_host,
                smtp_port: editingConfig.smtp_port,
                smtp_user: editingConfig.smtp_user,
                smtp_password: '', // Don't populate password for security
                from_email: editingConfig.from_email,
                from_name: editingConfig.from_name,
                use_tls: editingConfig.use_tls,
                use_ssl: editingConfig.use_ssl,
                is_active: editingConfig.is_active,
            });
        } else {
            setFormData({
                smtp_host: '',
                smtp_port: 587,
                smtp_user: '',
                smtp_password: '',
                from_email: '',
                from_name: '',
                use_tls: true,
                use_ssl: false,
                is_active: true,
            });
        }
    }, [editingConfig, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = editingConfig
                ? // For updates, only send changed fields (excluding empty password)
                Object.fromEntries(
                    Object.entries(formData).filter(([key, value]) => {
                        if (key === 'smtp_password' && !value) return false;
                        return true;
                    })
                )
                : formData;

            const success = await onSubmit(payload as any, editingConfig?.config_id);
            if (success) {
                onClose();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        {editingConfig ? 'Edit Email Configuration' : 'Add Email Configuration'}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            {/* SMTP Host */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    SMTP Host *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.smtp_host}
                                    onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="smtp.gmail.com"
                                />
                            </div>

                            {/* SMTP Port */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    SMTP Port *
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={formData.smtp_port}
                                    onChange={(e) => setFormData({ ...formData, smtp_port: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="587"
                                />
                            </div>

                            {/* SMTP User */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    SMTP User *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.smtp_user}
                                    onChange={(e) => setFormData({ ...formData, smtp_user: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="username@example.com"
                                />
                            </div>

                            {/* SMTP Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    SMTP Password {editingConfig ? '(leave blank to keep current)' : '*'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingConfig}
                                    value={formData.smtp_password}
                                    onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                />
                            </div>

                            {/* From Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    From Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.from_email}
                                    onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="noreply@example.com"
                                />
                            </div>

                            {/* From Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    From Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.from_name}
                                    onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="My Company"
                                />
                            </div>

                            {/* Checkboxes */}
                            <div className="flex gap-6">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.use_tls}
                                        onChange={(e) => setFormData({ ...formData, use_tls: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">Use TLS</span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.use_ssl}
                                        onChange={(e) => setFormData({ ...formData, use_ssl: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">Use SSL</span>
                                </label>

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
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Saving...' : editingConfig ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EmailConfigForm;
