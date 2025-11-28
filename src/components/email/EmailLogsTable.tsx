// src/components/email/EmailLogsTable.tsx
import React from 'react';
import { EmailLog } from '../../api/emailApi';

interface EmailLogsTableProps {
    logs: EmailLog[];
    isLoading: boolean;
    onViewDetails: (log: EmailLog) => void;
}

const EmailLogsTable: React.FC<EmailLogsTableProps> = ({ logs, isLoading, onViewDetails }) => {
    const getStatusBadge = (status: 'sent' | 'failed') => {
        if (status === 'sent') {
            return (
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    Sent
                </span>
            );
        }
        return (
            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                Failed
            </span>
        );
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            return date.toLocaleString();
        } catch {
            return dateString;
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-8 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    Loading email logs...
                </div>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-8 text-center text-gray-500">
                    No email logs found.
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Recipient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sent At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                        <tr key={log.log_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{log.recipient_email}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 max-w-xs truncate">{log.subject}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                    {log.email_type.charAt(0).toUpperCase() + log.email_type.slice(1).replace('_', ' ')}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(log.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(log.sent_at || log.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                    onClick={() => onViewDetails(log)}
                                    className="text-blue-600 hover:text-blue-900"
                                >
                                    View Details
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default EmailLogsTable;
