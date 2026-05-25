'use client';

import { useQuery } from '@tanstack/react-query';
import { AdminHeader } from '../components/components/AdminHeader';
import AdminTable, { type Column } from '../components/AdminTable';
import { ExternalLink, MessageSquare } from 'lucide-react';
import {
  ADMIN_DATA_GC_TIME,
  ADMIN_DATA_STALE_TIME,
  ADMIN_PLACEHOLDER_DATA,
  ADMIN_QUERY_KEYS,
  fetchAdminLeads,
  type Lead,
} from '../lib/adminQueries';

export default function AdminLeadsClient() {
  const { data: leads = [], isLoading: loading } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.leads,
    queryFn: fetchAdminLeads,
    staleTime: ADMIN_DATA_STALE_TIME,
    gcTime: ADMIN_DATA_GC_TIME,
    placeholderData: ADMIN_PLACEHOLDER_DATA.leads,
  });

  const columns: Column<Lead>[] = [
    {
      key: 'createdAt',
      label: 'Waktu',
      sortable: true,
      render: (val: unknown) =>
        new Date(String(val)).toLocaleString('id-ID', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
    },
    { key: 'name', label: 'Nama', sortable: true, className: 'font-medium text-gray-900' },
    {
      key: 'contact',
      label: 'Kontak',
      render: (val: unknown, item: Lead) => {
        const contactValue = String(val);
        let href = '#';
        if (item.contactType === 'WhatsApp') {
          let num = contactValue.replace(/\D/g, '');
          if (num.startsWith('0')) num = '62' + num.substring(1);
          if (!num.startsWith('62')) num = '62' + num;
          href = `https://wa.me/${num}`;
        } else {
          href = `mailto:${contactValue}`;
        }

        return (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
          >
            {item.contactType === 'WhatsApp' ? (
              <span className="mr-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                WA
              </span>
            ) : (
              <span className="mr-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-800">
                @
              </span>
            )}
            {contactValue}
            <ExternalLink className="h-3 w-3" />
          </a>
        );
      },
    },
    {
      key: 'message',
      label: 'Pesan',
      render: (val: unknown) => (
        <span title={String(val)} className="block max-w-xs truncate text-gray-600">
          {String(val)}
        </span>
      ),
    },
  ];

  return (
    <>
      <AdminHeader
        title="Database Pesan Masuk"
        titleIcon={<MessageSquare className="h-6 w-6 text-indigo-600" />}
        titleAccent="bg-indigo-50 text-indigo-700"
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Inquiry Terbaru</h3>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
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
      </div>
    </>
  );
}
