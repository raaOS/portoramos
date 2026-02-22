'use client';

import { useState } from 'react';
import { BriefcaseBusiness, Plus } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminExperience } from '../hooks/useAdminExperience';

// Modular Components
import StatsSection from './components/StatsSection';
import ExperienceCard from './components/ExperienceCard';
import ExperienceForm from './components/ExperienceForm';

export default function AdminExperienceClient() {
  const { csrfToken, isAdmin, isLoading: authLoading } = useAdminAuth();
  const {
    experienceData,
    loading,
    error,
    handleUpdateStats,
    handleUpdateWorkHistory
  } = useAdminExperience(csrfToken);

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  if (authLoading || (loading && !experienceData)) {
    return (
      <AdminLayout
        title="Experience Management"
        subtitle="Manage experience statistics and work history"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Experience' }]}
        titleIcon={<BriefcaseBusiness className="h-5 w-5" aria-hidden />}
        titleAccent="bg-emerald-50 text-emerald-700"
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mr-3"></div>
          Memuat data...
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout
        title="Unauthorized"
        subtitle="Access Denied"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Experience' }]}
        titleIcon={<BriefcaseBusiness className="h-5 w-5" aria-hidden />}
        titleAccent="bg-red-50 text-red-700"
      >
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Terbatas</h2>
          <p className="text-gray-600 mb-6">Silakan login terlebih dahulu untuk mengelola Experience.</p>
          <a href="/admin/login" className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700">Login</a>
        </div>
      </AdminLayout>
    );
  }

  if (!experienceData) {
    return (
      <AdminLayout
        title="Experience Management"
        subtitle="Manage experience statistics and work history"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Experience' }]}
        titleIcon={<BriefcaseBusiness className="h-5 w-5" aria-hidden />}
        titleAccent="bg-emerald-50 text-emerald-700"
      >
        <div className="flex items-center justify-center py-8">
          <p className="text-red-600">Failed to load experience data</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Experience Management"
      subtitle="Manage experience statistics and work history"
      breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Experience' }]}
      titleIcon={<BriefcaseBusiness className="h-5 w-5" aria-hidden />}
      titleAccent="bg-emerald-50 text-emerald-700"
    >
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
          <div className="text-sm text-gray-500">
            Last updated: {experienceData.lastUpdated ? new Date(experienceData.lastUpdated).toLocaleString() : 'Never'}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Statistics Section */}
        <StatsSection
          statistics={experienceData.statistics}
          onUpdate={handleUpdateStats}
        />

        {/* Work Experience Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Work Experience History</h3>
            {!isAddingNew && editingIndex === null && (
              <button
                onClick={() => setIsAddingNew(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New
              </button>
            )}
          </div>

          {(isAddingNew || editingIndex !== null) ? (
            <ExperienceForm
              work={editingIndex !== null ? experienceData.workExperience[editingIndex] : undefined}
              onCancel={() => { setIsAddingNew(false); setEditingIndex(null); }}
              onSave={async (item) => {
                const newList = [...experienceData.workExperience];
                if (isAddingNew) newList.push(item);
                else if (editingIndex !== null) newList[editingIndex] = item;

                const success = await handleUpdateWorkHistory(newList);
                if (success) { setIsAddingNew(false); setEditingIndex(null); }
              }}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {experienceData.workExperience.map((work, index) => (
                <ExperienceCard
                  key={index}
                  work={work}
                  onEdit={() => setEditingIndex(index)}
                  onDelete={async () => {
                    if (confirm('Are you sure you want to delete this experience entry?')) {
                      const newList = experienceData.workExperience.filter((_, i) => i !== index);
                      await handleUpdateWorkHistory(newList);
                    }
                  }}
                  onToggleStatus={async () => {
                    const newList = [...experienceData.workExperience];
                    newList[index] = { ...work, isActive: work.isActive === false ? true : false };
                    await handleUpdateWorkHistory(newList);
                  }}
                />
              ))}
              {experienceData.workExperience.length === 0 && (
                <div className="col-span-1 lg:col-span-2 text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">
                  No work experience added yet.
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
