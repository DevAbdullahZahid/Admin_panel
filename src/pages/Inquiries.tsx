// src/pages/Inquiries.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MessageSquare, Search, Mail, User, Clock, Copy, Check } from 'lucide-react';

interface Inquiry {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  status: 'new' | 'read' | 'replied';
}

export default function Inquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    // Same API as above — or use a different endpoint if you have one
    fetch('https://dev-api-iprep.rezotera.com/api/v1/support-inquiries/')
      .then(r => r.json())
      .then(data => setInquiries((data.results || data || []).map((i: any) => ({
        ...i,
        status: i.status || 'new'
      }))))
      .catch(() => {});
  }, []);

  const copy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const filtered = inquiries.filter(i =>
    [i.name, i.email, i.subject, i.message].some(field =>
      field.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8">
            <h1 className="text-4xl font-bold flex items-center gap-4">
              <MessageSquare className="w-12 h-12" />
              Customer Inquiries
            </h1>
            <p className="mt-2 opacity-90">All messages from users</p>
          </div>

          <div className="p-6">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search inquiries..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition"
              />
            </div>

            <div className="space-y-4">
              {filtered.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No inquiries found.</p>
              ) : (
                filtered.map((inq) => (
                  <div key={inq.id} className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {inq.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{inq.name}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {inq.email}
                            <button onClick={() => copy(inq.email, inq.id)}>
                              {copied === inq.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        inq.status === 'new' ? 'bg-red-100 text-red-700' :
                        inq.status === 'replied' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {inq.status}
                      </span>
                    </div>
                    <h4 className="font-semibold text-purple-700 mb-2">{inq.subject}</h4>
                    <p className="text-gray-700 mb-3">{inq.message}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {format(new Date(inq.created_at), 'MMMM d, yyyy ⋅ h:mm a')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}