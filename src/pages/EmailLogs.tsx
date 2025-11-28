// src/pages/EmailLogs.tsx
import React, { useState, useEffect } from 'react';
import EmailLogsTable from '../components/email/EmailLogsTable';
import { EmailLog, getLogs, getLogById } from '../api/emailApi';

const EmailLogs: React.FC = () => {
    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Fetch logs on mount
    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getLogs();
            setLogs(data);
        } catch (err: any) {
            console.error('Failed to load logs:', err);
            setError(err.message || 'Failed to load email logs');
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewDetails = async (log: EmailLog) => {
        try {
            // Fetch full log details
            const fullLog = await getLogById(log.log_id);
            setSelectedLog(fullLog);
            setIsDetailModalOpen(true);
        } catch (err: any) {
            console.error('Failed to load log details:', err);
            setError(err.message || 'Failed to load log details');
        }
    };

    const closeDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedLog(null);
    };

    // Filter logs by search query
    const filteredLogs = logs.filter((log) => {
        const term = searchQuery.toLowerCase();
        return (
            log.recipient_email.toLowerCase().includes(term) ||
            log.subject.toLowerCase().includes(term) ||
            log.email_type.toLowerCase().includes(term) ||
            log.status.toLowerCase().includes(term)
        );
    });

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Email Logs</h1>
                    <p className="text-gray-500 mt-1">View sent and failed email logs</p>
                </div>
                <button
                    onClick={loadLogs}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                    Refresh
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="font-bold">
                        ×
                    </button>
                </div>
            )}

            {/* Search */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search logs by recipient, subject, type, or status..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                />
            </div>

            {/* Logs Table */}
            <EmailLogsTable
                logs={filteredLogs}
                isLoading={isLoading}
                onViewDetails={handleViewDetails}
            />

            {/* Log Details Modal */}
            {isDetailModalOpen && selectedLog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-2xl font-bold text-gray-800">Email Log Details</h2>
                                <button
                                    onClick={closeDetailModal}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Status Badge */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <span
                                        className={`inline-block px-3 py-1 text-sm rounded-full ${selectedLog.status === 'sent'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {selectedLog.status.toUpperCase()}
                                    </span>
                                </div>

                                {/* Recipient */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Recipient Email
                                    </label>
                                    <p className="text-gray-900">{selectedLog.recipient_email}</p>
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <p className="text-gray-900">{selectedLog.subject}</p>
                                </div>

                                {/* Email Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Type
                                    </label>
                                    <p className="text-gray-900">
                                        {selectedLog.email_type.charAt(0).toUpperCase() +
                                            selectedLog.email_type.slice(1).replace('_', ' ')}
                                    </p>
                                </div>

                                {/* Sent At */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sent At</label>
                                    <p className="text-gray-900">
                                        {selectedLog.sent_at
                                            ? new Date(selectedLog.sent_at).toLocaleString()
                                            : selectedLog.created_at
                                                ? new Date(selectedLog.created_at).toLocaleString()
                                                : '—'}
                                    </p>
                                </div>

                                {/* Error Message (if failed) */}
                                {selectedLog.status === 'failed' && selectedLog.error_message && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Error Message
                                        </label>
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                            <p className="text-red-800 text-sm font-mono">{selectedLog.error_message}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Log ID */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Log ID</label>
                                    <p className="text-gray-600 text-sm font-mono">{selectedLog.log_id}</p>
                                </div>
                            </div>

                            {/* Close Button */}
                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={closeDetailModal}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailLogs;
