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
        provider: 'mailtrap',
        from_email: '',
        from_name: '',
        provider_config: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingConfig) {
            setFormData({
                provider: editingConfig.provider,
                from_email: editingConfig.from_email,
                from_name: editingConfig.from_name,
                provider_config: editingConfig.provider_config,
            });
        } else {
            setFormData({
                provider: 'mailtrap',
                from_email: '',
                from_name: '',
                provider_config: '',
            });
        }
    }, [editingConfig, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Validate JSON format
            try {
                JSON.parse(formData.provider_config);
            } catch {
                alert('Invalid JSON format in provider_config');
                setIsSubmitting(false);
                return;
            }

            const success = await onSubmit(formData as any, editingConfig?.config_id);
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        {editingConfig ? 'Edit Email Configuration' : 'Add Email Configuration'}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            {/* Provider */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Provider *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.provider}
                                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="mailtrap"
                                />
                                <p className="text-xs text-gray-500 mt-1">e.g., mailtrap, gmail, sendgrid</p>
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

                            {/* Provider Config */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Provider Config *
                                </label>
                                <textarea
                                    required
                                    value={formData.provider_config}
                                    onChange={(e) => setFormData({ ...formData, provider_config: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                    rows={3}
                                    placeholder='{"token": "your_api_token", "region": "us"}'
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Enter valid JSON configuration for your email provider
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    For Mailtrap: {`{"token": "your_api_token", "region": "us"}`}
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
