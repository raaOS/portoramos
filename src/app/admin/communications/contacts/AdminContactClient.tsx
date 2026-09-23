'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ContactData, UpdateContactData } from '@/types/contact';
import { AdminHeader } from '../../components/components/AdminHeader';
import { useToast } from '@/contexts/ToastContext';
import { PhoneCall, Type, Share2, Info } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  ADMIN_DATA_GC_TIME,
  ADMIN_DATA_STALE_TIME,
  ADMIN_PLACEHOLDER_DATA,
  ADMIN_QUERY_KEYS,
  fetchAdminContact,
} from '../../lib/adminQueries';
import { ContactContentForm } from './components/ContactContentForm';
import { ContactLabelsForm } from './components/ContactLabelsForm';
import { SocialMediaForm } from './components/SocialMediaForm';

const TABS = [
  { id: 'content', name: 'Page Content', icon: Type },
  { id: 'socials', name: 'Social Media', icon: Share2 },
  { id: 'labels', name: 'Settings', icon: Info },
] as const;

type ActiveTab = (typeof TABS)[number]['id'];

export default function AdminContactClient() {
  const queryClient = useQueryClient();
  const [, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('content');
  const { showSuccess, showError } = useToast();
  const { csrfToken } = useAdminAuth();

  const contactQuery = useQuery({
    queryKey: ADMIN_QUERY_KEYS.contact,
    queryFn: fetchAdminContact,
    staleTime: ADMIN_DATA_STALE_TIME,
    gcTime: ADMIN_DATA_GC_TIME,
    placeholderData: ADMIN_PLACEHOLDER_DATA.contact,
  });

  const contactData = contactQuery.data ?? null;
  const loading = contactQuery.isLoading;

  const handleUpdateContact = async (updateData: UpdateContactData) => {
    try {
      const response = await fetch('/api/contact', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken || '',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result?.data) {
          queryClient.setQueryData(ADMIN_QUERY_KEYS.contact, result.data as ContactData);
        } else {
          await queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.contact });
        }
        setError(null);
        showSuccess('Contact updated successfully.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(
          `Failed to update contact: ${errorData.error || response.statusText} (${response.status})`
        );
        showError(
          `Failed to update contact: ${errorData.error || response.statusText} (${response.status})`
        );
      }
    } catch (err) {
      setError(`Failed to update contact: ${err instanceof Error ? err.message : 'Network error'}`);
      showError(
        `Failed to update contact: ${err instanceof Error ? err.message : 'Network error'}`
      );
    }
  };

  if (loading) {
    return (
      <>
        <AdminHeader
          title="Contact Page"
          titleIcon={<PhoneCall className="h-5 w-5" aria-hidden />}
          titleAccent="bg-amber-50 text-amber-700"
        />
        <div className="flex-1 space-y-6 p-6">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-600"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader
        title="Contact Page"
        titleIcon={<PhoneCall className="h-5 w-5" aria-hidden />}
        titleAccent="bg-amber-50 text-amber-700"
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {/* Modern Tabs */}
          <div className="border-b border-gray-200 bg-gray-50/50">
            <nav className="flex space-x-1 px-4 py-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-amber-100 text-amber-800 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    } `}
                  >
                    <Icon
                      className={`mr-2 h-4 w-4 ${activeTab === tab.id ? 'text-amber-600' : 'text-gray-400'}`}
                    />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'content' && contactData && (
              <div className="max-w-2xl">
                <h3 className="mb-6 text-lg font-medium text-gray-900">Edit Page Text</h3>
                <ContactContentForm
                  data={contactData.content || { headline: '', subtext: '' }}
                  onUpdate={(data) => handleUpdateContact({ content: data })}
                />
              </div>
            )}

            {activeTab === 'labels' && contactData && (
              <div className="max-w-2xl">
                <h3 className="mb-6 text-lg font-medium text-gray-900">UI Labels & Settings</h3>
                <ContactLabelsForm
                  labels={contactData.labels || {}}
                  onUpdate={(labels) => handleUpdateContact({ labels })}
                />
              </div>
            )}

            {activeTab === 'socials' && contactData && (
              <div className="max-w-2xl">
                <h3 className="mb-6 text-lg font-medium text-gray-900">Manage Social Links</h3>
                <SocialMediaForm
                  data={contactData.info.socialMedia}
                  onUpdate={(socialData) =>
                    handleUpdateContact({ info: { ...contactData.info, socialMedia: socialData } })
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
