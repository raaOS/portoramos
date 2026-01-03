'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import AdminTable from '../components/AdminTable';
import { ExternalLink, MessageSquare } from 'lucide-react';

export default function AdminLeadsClient() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const res = await fetch('/api/leads');
            if (res.ok) {
                const data = await res.json();
                setLeads(data);
            }
        } catch (error) {
            console.error('Failed to fetch leads', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            key: 'createdAt',
            label: 'Date',
            sortable: true,
            render: (val: string) => new Date(val).toLocaleString('id-ID', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            })
        },
        { key: 'name', label: 'Name', sortable: true, className: 'font-medium text-gray-900' },
        {
            key: 'contact',
            label: 'Contact',
            render: (val: string, item: any) => {
                let href = '#';
                if (item.contactType === 'WhatsApp') {
                    // Basic cleaning for WA link
                    let num = val.replace(/\D/g, '');
                    if (num.startsWith('0')) num = '62' + num.substring(1);
                    if (!num.startsWith('62')) num = '62' + num;
                    href = `https://wa.me/${num}`;
                } else {
                    href = `mailto:${val}`;
                }

                return (
                    <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline">
                        {item.contactType === 'WhatsApp' ? (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full mr-1">WA</span>
                        ) : (
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full mr-1">@</span>
                        )}
                        {val}
                        <ExternalLink className="w-3 h-3" />
                    </a>
                );
            }
        },
        {
            key: 'message',
            label: 'Message',
            render: (val: string) => (
                <span title={val} className="block max-w-xs truncate text-gray-600">
                    {val}
                </span>
            )
        },
    ];

    return (
        <AdminLayout
            title="Leads Database"
            subtitle="Potential clients from Website Chat Widget"
            titleIcon={<MessageSquare className="w-6 h-6 text-indigo-600" />}
            titleAccent="bg-indigo-50 text-indigo-700"
        >
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Recent Inquiries</h3>
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                            {leads.length} Total
                        </span>
                    </div>

                    <AdminTable
                        columns={columns}
                        data={leads}
                        loading={loading}
                        emptyMessage="Belum ada pesan masuk."
                    />
                </div>
            </div>
        </AdminLayout>
    );
}
