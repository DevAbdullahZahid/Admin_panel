// src/pages/Inquiries.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  MessageSquare, Search, Mail, Copy, Check, Clock, AlertCircle,
  ArrowLeft, User, Calendar, MailIcon, Send
} from 'lucide-react';
import { apiFetch } from '../utils/apiService';

interface Reply {
  replied_by: number;
  reply_message: string;
  replied_at: string;
}

interface Inquiry {
  id: number;
  user_id: number;
  subject: string;
  message: string;
  status: 'submitted' | 'resolved';
  reply: Reply | null;
  created_at: string;
  updated_at: string;
  // Optional fields for list view compatibility
  name?: string;
  email?: string;
}

export default function Inquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      alert('Failed to copy');
    }
  };

  const loadInquiries = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch('/support-form/');
      console.log('Support Form API Response:', response);

      // API returns tickets, not inquiries
      const inquiriesArray = response?.data?.tickets;

      console.log('Tickets Array:', inquiriesArray);

      if (!Array.isArray(inquiriesArray)) {
        console.warn('No tickets array found in response');
        setInquiries([]);
        return;
      }

      const formatted = inquiriesArray.map((i: any) => ({
        id: i.id,
        user_id: i.user_id,
        name: i.name || 'Anonymous',
        email: i.email || 'no-email@provided.com',
        subject: i.subject || '(No subject)',
        message: i.message || '(No message)',
        created_at: i.created_at || new Date().toISOString(),
        updated_at: i.updated_at || new Date().toISOString(),
        status: (i.status || 'submitted') as 'submitted' | 'resolved',
        reply: i.reply || null,
      }));

      console.log('Formatted inquiries:', formatted);
      setInquiries(formatted);
    } catch (err: any) {
      console.error('Failed to load inquiries:', err);
      setError(err.message || 'Failed to load inquiries.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInquiryDetails = async (id: number) => {
    try {
      const response = await apiFetch(`/support-form/${id}`);
      console.log('Inquiry Details Response:', response);
      const form = response?.data?.form;

      if (form) {
        setSelectedInquiry({
          id: form.id,
          user_id: form.user_id,
          subject: form.subject,
          message: form.message,
          status: form.status,
          reply: form.reply,
          created_at: form.created_at,
          updated_at: form.updated_at,
          name: form.name || 'Anonymous',
          email: form.email || 'no-email@provided.com',
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch inquiry details:', err);
      alert('Failed to load inquiry details: ' + err.message);
    }
  };

  const handleInquiryClick = (inquiry: Inquiry) => {
    fetchInquiryDetails(inquiry.id);
  };

  const submitReply = async () => {
    if (!selectedInquiry || !replyMessage.trim()) {
      setReplyError('Please enter a reply message');
      return;
    }

    try {
      setSubmitting(true);
      setReplyError(null);

      const response = await apiFetch('/support-form/reply', {
        method: 'POST',
        body: JSON.stringify({
          form_id: selectedInquiry.id,
          reply_message: replyMessage.trim(),
        }),
      });

      console.log('Reply Response:', response);

      // Update the selected inquiry with the reply
      const updatedForm = response?.data?.form;
      if (updatedForm) {
        setSelectedInquiry({
          ...selectedInquiry,
          status: updatedForm.status,
          reply: updatedForm.reply,
          updated_at: updatedForm.updated_at,
        });

        // Update the inquiry in the list
        setInquiries(prev =>
          prev.map(inq =>
            inq.id === selectedInquiry.id
              ? { ...inq, status: updatedForm.status, reply: updatedForm.reply }
              : inq
          )
        );

        setReplyMessage('');
        alert('Reply sent successfully!');
      }
    } catch (err: any) {
      console.error('Failed to submit reply:', err);
      setReplyError(err.message || 'Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const filtered = inquiries.filter(i =>
    [i.name, i.email, i.subject, i.message].some(field =>
      field?.toLowerCase().includes(search.toLowerCase())
    )
  );

  // Loading & Error States
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl text-purple-700">Loading inquiries...</p>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600">{error}</p>
          <button onClick={() => loadInquiries()} className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // FULL EMAIL VIEW
  if (selectedInquiry) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
            <button
              onClick={() => setSelectedInquiry(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Inbox
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-xl font-semibold text-gray-800">Inquiry Details</h1>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8">
              <h2 className="text-3xl font-bold">{selectedInquiry.subject}</h2>
              <div className="flex items-center gap-4 mt-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-2xl font-bold">
                  {selectedInquiry.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-xl font-semibold">{selectedInquiry.name || 'Anonymous'}</p>
                  <p className="opacity-90 flex items-center gap-2">
                    <MailIcon className="w-4 h-4" />
                    {selectedInquiry.email || 'No email'}
                    {selectedInquiry.email && (
                      <button
                        onClick={() => copyToClipboard(selectedInquiry.email!, selectedInquiry.id)}
                        className="ml-2"
                      >
                        {copied === selectedInquiry.id ? <Check className="w-5 h-5 text-green-300" /> : <Copy className="w-5 h-5" />}
                      </button>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-8">
              <div className="flex items-center gap-6 text-sm text-gray-600 mb-8">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(selectedInquiry.created_at), 'EEEE, MMMM d, yyyy ⋅ h:mm a')}
                </div>
                <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase ${selectedInquiry.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                    selectedInquiry.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                  }`}>
                  {selectedInquiry.status}
                </span>
              </div>

              <div className="prose prose-lg max-w-none">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">User Message:</h3>
                <p className="whitespace-pre-wrap text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-lg">
                  {selectedInquiry.message}
                </p>
              </div>

              {/* Existing Reply */}
              {selectedInquiry.reply && (
                <div className="mt-8 pt-8 border-t">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Admin Reply
                  </h3>
                  <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
                    <p className="text-gray-800 whitespace-pre-wrap mb-4">
                      {selectedInquiry.reply.reply_message}
                    </p>
                    <div className="text-sm text-gray-600">
                      <p>Replied by Admin ID: {selectedInquiry.reply.replied_by}</p>
                      <p>Replied at: {format(new Date(selectedInquiry.reply.replied_at), 'MMMM d, yyyy ⋅ h:mm a')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Reply Form */}
              {selectedInquiry.status === 'submitted' && !selectedInquiry.reply && (
                <div className="mt-12 pt-8 border-t">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Send Reply</h3>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply here..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition resize-none"
                    rows={6}
                  />
                  {replyError && (
                    <p className="text-red-600 text-sm mt-2">{replyError}</p>
                  )}
                  <button
                    onClick={submitReply}
                    disabled={submitting || !replyMessage.trim()}
                    className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    {submitting ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8">
            <h1 className="text-4xl font-bold flex items-center gap-4">
              <MessageSquare className="w-12 h-12" />
              Customer Inquiries
            </h1>
            <p className="mt-2 opacity-90">
              {inquiries.length} total • {inquiries.filter(i => i.status === 'submitted').length} pending
            </p>
          </div>

          <div className="p-6 border-b">
            <div className="relative">
              <Search className="absolute left-4 top-4 text-gray-400 w-6 h-6" />
              <input
                type="text"
                placeholder="Search inquiries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-14 pr-6 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition text-lg"
              />
            </div>
          </div>

          <div className="p-6 space-y-4 max-h-screen overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <MessageSquare className="w-20 h-20 mx-auto mb-4 opacity-30" />
                <p className="text-xl">
                  {search ? 'No matches found.' : 'No inquiries yet.'}
                </p>
              </div>
            ) : (
              filtered.map((inq) => (
                <div
                  key={inq.id}
                  onClick={() => handleInquiryClick(inq)}
                  className="bg-gray-50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 border-l-4 border-transparent hover:border-purple-500 cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {inq.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-purple-700 transition">
                          {inq.name || 'Anonymous'}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">{inq.email || 'No email'}</p>
                        <h4 className="font-semibold text-purple-700 mt-2">{inq.subject}</h4>
                        <p className="text-gray-600 mt-1 line-clamp-1">{inq.message}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {format(new Date(inq.created_at), 'MMM d')}
                      </p>
                      {inq.status === 'submitted' && (
                        <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mt-2"></span>
                      )}
                      {inq.status === 'resolved' && (
                        <span className="inline-block w-3 h-3 bg-green-500 rounded-full mt-2"></span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}