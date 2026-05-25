'use client';

import { useState } from 'react';
import { BriefcaseBusiness, Plus } from 'lucide-react';
import { AdminHeader } from '../components/components/AdminHeader';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminExperience } from '../hooks/useAdminExperience';
import { useConfirm } from '@/components/admin/ConfirmDialog';

// Modular Components
import StatsSection from './components/StatsSection';
import ExperienceCard from './components/ExperienceCard';
import ExperienceForm from './components/ExperienceForm';
import AdminLoading from '@/components/admin/AdminLoading';

export default function AdminExperienceClient() {
  const { csrfToken, isAdmin, isLoading: authLoading } = useAdminAuth();
  const { confirm } = useConfirm();
  const { experienceData, loading, error, handleUpdateStats, handleUpdateWorkHistory } =
    useAdminExperience(csrfToken);

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (authLoading || (loading && !experienceData)) {
    return (
      <>
        <AdminHeader
          title="Experience Management"
          titleIcon={<BriefcaseBusiness className="h-5 w-5" aria-hidden />}
          titleAccent="bg-emerald-50 text-emerald-700"
        />
        <div className="flex-1 space-y-6 p-6">
          <AdminLoading size="default" />
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <AdminHeader
          title="Unauthorized"
          titleIcon={<BriefcaseBusiness className="h-5 w-5" aria-hidden />}
          titleAccent="bg-red-50 text-red-700"
        />
        <div className="flex-1 space-y-6 p-6">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Akses Terbatas</h2>
            <p className="mb-6 text-gray-600">
              Silakan login terlebih dahulu untuk mengelola Experience.
            </p>
            <a
              href="/admin/login"
              className="rounded-lg bg-emerald-600 px-6 py-2 font-semibold text-white hover:bg-emerald-700"
            >
              Login
            </a>
          </div>
        </div>
      </>
    );
  }

  if (!experienceData) {
    return (
      <>
        <AdminHeader
          title="Experience Management"
          titleIcon={<BriefcaseBusiness className="h-5 w-5" aria-hidden />}
          titleAccent="bg-emerald-50 text-emerald-700"
        />
        <div className="flex-1 space-y-6 p-6">
          <div className="flex items-center justify-center py-8">
            <p className="text-red-600">Failed to load experience data</p>
          </div>
        </div>
      </>
    );
  }

  const editingWork = editingId
    ? experienceData.workExperience.find((work) => work.id === editingId)
    : undefined;

  return (
    <>
      <AdminHeader
        title="Experience Management"
        titleIcon={<BriefcaseBusiness className="h-5 w-5" aria-hidden />}
        titleAccent="bg-emerald-50 text-emerald-700"
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
            <div className="text-sm text-gray-500">
              Last updated:{' '}
              {experienceData.lastUpdated
                ? new Date(experienceData.lastUpdated).toLocaleString()
                : 'Never'}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          {/* Statistics Section */}
          <StatsSection statistics={experienceData.statistics} onUpdate={handleUpdateStats} />

          {/* Work Experience Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Work Experience History</h3>
              {!isAddingNew && editingId === null && (
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add New
                </button>
              )}
            </div>

            {isAddingNew || editingId !== null ? (
              <ExperienceForm
                work={editingWork}
                onCancel={() => {
                  setIsAddingNew(false);
                  setEditingId(null);
                }}
                onSave={async (item) => {
                  const newList = isAddingNew
                    ? [...experienceData.workExperience, item]
                    : experienceData.workExperience.map((work) =>
                        work.id === item.id ? item : work
                      );

                  const success = await handleUpdateWorkHistory(newList);
                  if (success) {
                    setIsAddingNew(false);
                    setEditingId(null);
                  }
                }}
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {experienceData.workExperience.map((work) => (
                  <ExperienceCard
                    key={work.id}
                    work={work}
                    onEdit={() => setEditingId(work.id)}
                    onDelete={async () => {
                      const ok = await confirm({
                        title: 'Hapus pengalaman kerja?',
                        message: 'Entry ini akan dihapus permanen dari riwayat experience.',
                        confirmText: 'Hapus',
                        cancelText: 'Batal',
                        tone: 'danger',
                      });
                      if (ok) {
                        const newList = experienceData.workExperience.filter(
                          (item) => item.id !== work.id
                        );
                        await handleUpdateWorkHistory(newList);
                      }
                    }}
                    onToggleStatus={async () => {
                      const newList = experienceData.workExperience.map((item) =>
                        item.id === work.id
                          ? { ...item, isActive: work.isActive === false ? true : false }
                          : item
                      );
                      await handleUpdateWorkHistory(newList);
                    }}
                  />
                ))}
                {experienceData.workExperience.length === 0 && (
                  <div className="col-span-1 rounded-lg border border-dashed border-gray-300 bg-gray-50 py-10 text-center text-gray-500 lg:col-span-2">
                    No work experience added yet.
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
