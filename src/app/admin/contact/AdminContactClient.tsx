'use client';

import { useState, useEffect, useCallback } from 'react';
import { ContactData, UpdateContactData } from '@/types/contact';
import AdminLayout from '../components/AdminLayout';
import { useToast } from '@/contexts/ToastContext';
import { PhoneCall, Type, Share2 } from 'lucide-react';

export default function AdminContactClient() {
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'socials'>('content');
  const { showSuccess, showError } = useToast();

  const loadContactData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contact');
      const data = await response.json();
      setContactData(data);
    } catch (err) {
      setError('Failed to load contact data');
      showError('Failed to load contact data.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadContactData();
  }, [loadContactData]);

  const handleUpdateContact = async (updateData: UpdateContactData) => {
    try {
      const response = await fetch('/api/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await loadContactData();
        setError(null);
        showSuccess('Contact updated successfully.');
      } else {
        setError('Failed to update contact data');
        showError('Failed to update contact data.');
      }
    } catch (err) {
      setError('Failed to update contact data');
      showError('Failed to update contact data.');
    }
  };

  if (loading) {
    return (
      <AdminLayout
        title="Contact Page"
        subtitle="Manage headline, subtext, and social links"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Contact' }]}
        titleIcon={<PhoneCall className="h-5 w-5" aria-hidden />}
        titleAccent="bg-amber-50 text-amber-700"
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Contact Page"
      subtitle="Manage headline, subtext, and social links"
      breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Contact' }]}
      titleIcon={<PhoneCall className="h-5 w-5" aria-hidden />}
      titleAccent="bg-amber-50 text-amber-700"
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Modern Tabs */}
        <div className="border-b border-gray-200 bg-gray-50/50">
          <nav className="flex space-x-1 px-4 py-2">
            {[
              { id: 'content', name: 'Page Content', icon: Type },
              { id: 'socials', name: 'Social Media', icon: Share2 }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${activeTab === tab.id
                      ? 'bg-amber-100 text-amber-800 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-amber-600' : 'text-gray-400'}`} />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'content' && contactData && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Edit Page Text</h3>
              <ContactContentForm
                data={contactData.content || { headline: '', subtext: '' }}
                onUpdate={(data) => handleUpdateContact({ content: data })}
              />
            </div>
          )}

          {activeTab === 'socials' && contactData && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Manage Social Links</h3>
              <SocialMediaForm
                data={contactData.info.socialMedia}
                onUpdate={(socialData) => handleUpdateContact({ info: { ...contactData.info, socialMedia: socialData } })}
              />
            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
}

// --- Subcomponents ---

function ContactContentForm({ data, onUpdate }: { data: any, onUpdate: (d: any) => void }) {
  const [form, setForm] = useState(data);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Headline (Judul Utama)
        </label>
        <p className="text-xs text-gray-500 mb-2">Gunakan Enter untuk baris baru (seperti "Create \n Universe").</p>
        <textarea
          required
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-mono text-sm"
          placeholder="Let's Create..."
          value={form.headline}
          onChange={(e) => setForm({ ...form, headline: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Subtext (Deskripsi)
        </label>
        <textarea
          required
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
          placeholder="We build digital experiences..."
          value={form.subtext}
          onChange={(e) => setForm({ ...form, subtext: e.target.value })}
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-black transition-colors shadow-sm"
        >
          Save Content
        </button>
      </div>
    </form>
  );
}

function SocialMediaForm({ data, onUpdate }: { data: any, onUpdate: (d: any) => void }) {
  const [form, setForm] = useState(data || {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(form);
  };

  const platforms = [
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
    { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
    { key: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/6281234567890' },
    { key: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/username' },
    { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
    { key: 'behance', label: 'Behance', placeholder: 'https://behance.net/username' },
    { key: 'email', label: 'Email (Optional override)', placeholder: 'mailto:email@example.com' } // Actually email is separate in info, but user asked for "sosmednya dibawah". Let's stick to socialMedia object for now.
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {platforms.map((p) => (
        <div key={p.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
            {p.label}
          </label>
          <input
            type="text"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
            placeholder={p.placeholder}
            value={form[p.key] || ''}
            onChange={(e) => setForm({ ...form, [p.key]: e.target.value })}
          />
        </div>
      ))}

      <div className="pt-4">
        <button
          type="submit"
          className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-black transition-colors shadow-sm"
        >
          Update Social Links
        </button>
      </div>
    </form>
  );
}


