'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Inbox,
  Search,
  Mail,
  User,
  Calendar,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

import { apiFetch } from '../utils/apiService';

interface Submission {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string | null;
}

export default function ContactFormSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/contact-form/', {
        method: 'GET',
      });

      console.log('API Response:', response);

      const items: Submission[] =
        response?.data?.inquiries?.map((item: any) => ({
          ...item,
          createdAt: item.createdAt || null,
        })) || [];

      setSubmissions(items);
    } catch (err: any) {
      console.error('Fetch failed:', err);

      if (err?.status === 401) {
        setError('Session expired. Please log in again.');
      } else if (err?.status === 403) {
        setError('You do not have permission to view inquiries.');
      } else {
        setError('Failed to connect to server. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const copyEmail = (email: string, id: number) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filtered = submissions.filter((s) =>
    [s.name, s.email, s.subject, s.message]
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="max-w-lg w-full bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-800">Error Loading Submissions</h3>
          <p className="text-red-600 mt-3">{error}</p>
          <button
            onClick={fetchSubmissions}
            className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-5 h-5" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
              <Inbox className="w-12 h-12 text-purple-600" />
              Contact Form Submissions
            </h1>
            <p className="text-gray-600 mt-2">
              {submissions.length} total message{submissions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={fetchSubmissions}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* SEARCH */}
        <div className="mb-6 max-w-lg">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search name, email, subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-16 text-center">
              <Mail className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {searchTerm ? 'No matching submissions found.' : 'No submissions yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Name</th>
                    <th className="px-6 py-4 text-left">Email</th>
                    <th className="px-6 py-4 text-left">Subject</th>
                    <th className="px-6 py-4 text-left">Message</th>
                    <th className="px-6 py-4 text-left">Received</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-purple-50 transition">
                      <td className="px-6 py-5 flex items-center gap-3">
                        <User className="w-5 h-5 text-purple-600" />
                        <span className="font-medium">{item.name}</span>
                      </td>

                      <td className="px-6 py-5 flex items-center gap-2">
                        <span className="text-blue-600 font-medium">{item.email}</span>
                        <button onClick={() => copyEmail(item.email, item.id)}>
                          {copiedId === item.id ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-500 hover:text-purple-600" />
                          )}
                        </button>
                      </td>

                      <td className="px-6 py-5 font-medium">{item.subject}</td>

                      <td className="px-6 py-5 max-w-md">
                        <p className="text-gray-600 line-clamp-3">{item.message}</p>
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {item.createdAt
                          ? format(new Date(item.createdAt), 'MMM d, yyyy • h:mm a')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
