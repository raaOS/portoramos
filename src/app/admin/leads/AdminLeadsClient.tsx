'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import AdminTable from '../components/AdminTable';
import { ExternalLink, MessageSquare } from 'lucide-react';



interface Lead extends Record<string, unknown> {
    id: string;
    createdAt: string;
    name: string;
    contact: string;
    contactType: 'WhatsApp' | 'Email';
    message: string;
}

export default function AdminLeadsClient() {
    const [leads, setLeads] = useState<Lead[]>([]);
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
        } catch (_error) {
            console.error('Failed to fetch leads', _error);
        } finally {
            setLoading(false);
        }
    };

    const columns: any[] = [
        {
            key: 'createdAt',
            label: 'Tanggal',
            sortable: true,
            render: (val: unknown) => new Date(String(val)).toLocaleString('id-ID', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            })
        },
        { key: 'name', label: 'Nama', sortable: true, className: 'font-medium text-gray-900' },
        {
            key: 'contact',
            label: 'Kontak',
            render: (val: unknown, item: Lead) => {
                const contactValue = String(val);
                let href = '#';
                if (item.contactType === 'WhatsApp') {
                    // Basic cleaning for WA link
                    let num = contactValue.replace(/\D/g, '');
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
                        {contactValue}
                        <ExternalLink className="w-3 h-3" />
                    </a>
                );
            }
        },
        {
            key: 'message',
            label: 'Pesan',
            render: (val: unknown) => (
                <span title={String(val)} className="block max-w-xs truncate text-gray-600">
                    {String(val)}
                </span>
            )
        },
    ];

    return (
        <AdminLayout
            title="Database Pesan Masuk"
            subtitle="Pesan potensial dari Widget Chat Website"
            titleIcon={<MessageSquare className="w-6 h-6 text-indigo-600" />}
            titleAccent="bg-indigo-50 text-indigo-700"
        >
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Inquiry Terbaru</h3>
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
