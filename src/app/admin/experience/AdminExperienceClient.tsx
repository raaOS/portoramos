'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ExperienceData, WorkExperience } from '@/types/experience';
import AdminButton from '../components/AdminButton';
import AdminLayout from '../components/AdminLayout';
import { useToast } from '@/contexts/ToastContext';
import { BriefcaseBusiness, Pencil, Save, X, Plus, Trash2 } from 'lucide-react';
import StatusToggle from '../components/StatusToggle';

export default function AdminExperienceClient() {
  const [experienceData, setExperienceData] = useState<ExperienceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingStats, setEditingStats] = useState(false);

  // Work Experience Edit State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [workFormData, setWorkFormData] = useState<Partial<WorkExperience>>({});

  // Stats Form Data
  const [statsFormData, setStatsFormData] = useState<Partial<ExperienceData['statistics']>>({});

  const { showSuccess, showError } = useToast();

  const loadExperienceData = async () => {
    try {
      const response = await fetch('/api/experience');
      const data: ExperienceData = await response.json();
      setExperienceData(data);
      setError(null);
    } catch (error) {
      console.error('Error loading experience data:', error);
      setError('Failed to load experience data');
      showError('Failed to load experience data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExperienceData();
  }, []);

  // --- Statistics Handlers ---

  const handleEditStats = () => {
    if (!experienceData) return;
    setStatsFormData({ ...experienceData.statistics });
    setEditingStats(true);
  };

  const handleCancelStats = () => {
    setEditingStats(false);
    setStatsFormData({});
  };

  const handleSaveStats = async () => {
    if (!experienceData) return;
    try {
      const response = await fetch('/api/experience', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statistics: { ...experienceData.statistics, ...statsFormData }
        })
      });

      if (response.ok) {
        setEditingStats(false);
        await loadExperienceData();
        showSuccess('Statistics updated successfully.');
      } else {
        showError('Failed to update statistics.');
      }
    } catch (error) {
      showError('Failed to update statistics.');
    }
  };

  // --- Work Experience Handlers ---

  const handleAddNew = () => {
    setWorkFormData({
      position: '',
      company: '',
      year: '',
      duration: '',
      description: [],
      imageUrl: '',
      isActive: true
    });
    setIsAddingNew(true);
    setEditingIndex(null);
  };

  const handleEditItem = (index: number) => {
    if (!experienceData) return;
    const item = experienceData.workExperience[index];
    setWorkFormData({ ...item });
    setEditingIndex(index);
    setIsAddingNew(false);
  };

  const handleCancelWorkEdit = () => {
    setIsAddingNew(false);
    setEditingIndex(null);
    setWorkFormData({});
  };

  const handleSaveWorkItem = async () => {
    if (!experienceData) return;

    // Construct new array
    let updatedList = [...experienceData.workExperience];

    const newItem = {
      position: workFormData.position || '',
      company: workFormData.company || '',
      year: workFormData.year || '',
      duration: workFormData.duration || '',
      description: workFormData.description || [],
      imageUrl: workFormData.imageUrl || '',
      isActive: workFormData.isActive !== undefined ? workFormData.isActive : true,
    };

    if (isAddingNew) {
      updatedList.push(newItem);
    } else if (editingIndex !== null) {
      updatedList[editingIndex] = newItem;
    } else {
      return;
    }

    try {
      const response = await fetch('/api/experience', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workExperience: updatedList
        })
      });

      if (response.ok) {
        handleCancelWorkEdit();
        await loadExperienceData();
        showSuccess(isAddingNew ? 'New experience added.' : 'Experience updated.');
      } else {
        showError('Failed to save experience.');
      }
    } catch (error) {
      showError('Failed to save experience.');
    }
  };

  const handleDeleteItem = async (index: number) => {
    if (!experienceData || !confirm('Are you sure you want to delete this experience entry?')) return;

    const updatedList = experienceData.workExperience.filter((_, i) => i !== index);

    try {
      const response = await fetch('/api/experience', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workExperience: updatedList
        })
      });

      if (response.ok) {
        await loadExperienceData();
        showSuccess('Experience deleted.');
      } else {
        showError('Failed to delete experience.');
      }
    } catch (error) {
      showError('Failed to delete experience.');
    }
  };

  // --- Render ---

  if (loading && !experienceData) {
    return (
      <AdminLayout
        title="Experience Management"
        subtitle="Manage experience statistics and work history"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Experience' }]}
        titleIcon={<BriefcaseBusiness className="h-5 w-5" aria-hidden />}
        titleAccent="bg-emerald-50 text-emerald-700"
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
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
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-9000">Global Statistics</h3>
            {!editingStats && (
              <button
                onClick={handleEditStats}
                className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit Stats
              </button>
            )}
          </div>

          {editingStats ? (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <input
                    type="text"
                    value={statsFormData.years || ''}
                    onChange={(e) => setStatsFormData(prev => ({ ...prev, years: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Projects Completed</label>
                  <input
                    type="text"
                    value={statsFormData.projects || ''}
                    onChange={(e) => setStatsFormData(prev => ({ ...prev, projects: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Design Tools</label>
                  <input
                    type="text"
                    value={statsFormData.designTools || ''}
                    onChange={(e) => setStatsFormData(prev => ({ ...prev, designTools: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Satisfaction</label>
                  <input
                    type="text"
                    value={statsFormData.clientSatisfaction || ''}
                    onChange={(e) => setStatsFormData(prev => ({ ...prev, clientSatisfaction: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-1 md:col-span-2 flex justify-end gap-2 pt-2">
                  <AdminButton onClick={handleCancelStats} variant="secondary">Cancel</AdminButton>
                  <AdminButton onClick={handleSaveStats} variant="primary">Save Changes</AdminButton>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-1">{experienceData.statistics.years}</div>
                <div className="text-sm font-medium text-gray-500">Years Exp.</div>
              </div>
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-1">{experienceData.statistics.projects}</div>
                <div className="text-sm font-medium text-gray-500">Projects</div>
              </div>
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-1">{experienceData.statistics.designTools}</div>
                <div className="text-sm font-medium text-gray-500">Design Tools</div>
              </div>
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-1">{experienceData.statistics.clientSatisfaction}</div>
                <div className="text-sm font-medium text-gray-500">Satisfaction</div>
              </div>
            </div>
          )}
        </section>

        {/* Work Experience Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Work Experience History</h3>
            {!isAddingNew && editingIndex === null && (
              <button
                onClick={handleAddNew}
                className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New
              </button>
            )}
          </div>

          {(isAddingNew || editingIndex !== null) ? (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm animate-in fade-in duration-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-semibold text-gray-800">{isAddingNew ? 'Add New Position' : 'Edit Position'}</h4>
                <button onClick={handleCancelWorkEdit} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Position</label>
                  <input
                    type="text"
                    value={workFormData.position || ''}
                    onChange={(e) => setWorkFormData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. Senior Designer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Company</label>
                  <input
                    type="text"
                    value={workFormData.company || ''}
                    onChange={(e) => setWorkFormData(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. Tech Corp"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Year</label>
                  <input
                    type="text"
                    value={workFormData.year || ''}
                    onChange={(e) => setWorkFormData(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. 2020-2023"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Duration</label>
                  <input
                    type="text"
                    value={workFormData.duration || ''}
                    onChange={(e) => setWorkFormData(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. 3 years"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={workFormData.imageUrl || ''}
                      onChange={(e) => setWorkFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="https://example.com/company-logo.png"
                    />
                  </div>
                  {workFormData.imageUrl && (
                    <div className="mt-2 flex items-center gap-3 p-2 bg-white rounded border border-gray-200 max-w-xs">
                      <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                        <Image
                          src={workFormData.imageUrl}
                          alt="Preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <span className="text-xs text-gray-500 truncate">{workFormData.imageUrl}</span>
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={workFormData.isActive ?? true}
                      onChange={(e) => setWorkFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Aktifkan</span>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description (comma separated)</label>
                  <textarea
                    rows={3}
                    value={Array.isArray(workFormData.description) ? workFormData.description.join(', ') : workFormData.description || ''}
                    onChange={(e) => {
                      setWorkFormData(prev => ({
                        ...prev,
                        description: e.target.value.split(',').map(d => d.trim()).filter(d => d)
                      }));
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Led design team, Improved UX by 20%, etc."
                  />
                  <p className="mt-1 text-xs text-gray-500">Each comma creates a new bullet point.</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                <AdminButton onClick={handleCancelWorkEdit} variant="secondary">Cancel</AdminButton>
                <AdminButton onClick={handleSaveWorkItem} variant="primary">{isAddingNew ? 'Add Position' : 'Update Position'}</AdminButton>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {experienceData.workExperience.map((work, index) => (
                <div key={index} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="relative w-16 h-16 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                      {work.imageUrl ? (
                        <Image
                          src={work.imageUrl}
                          alt={work.company}
                          fill
                          className="object-cover"
                          sizes="64px"
                          unoptimized
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-300">
                          <BriefcaseBusiness className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-bold text-gray-900 truncate">{work.position}</h4>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600 mb-2">
                        <span className="font-medium text-gray-800">{work.company}</span>
                        <span className="text-gray-300">•</span>
                        <span>{work.year}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-500">{work.duration}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-500">{work.duration}</span>
                      </div>
                      <ul className="list-disc list-outside pl-4 space-y-1">
                        {work.description.slice(0, 3).map((desc, i) => (
                          <li key={i} className="text-sm text-gray-600 leading-snug">{desc}</li>
                        ))}
                        {work.description.length > 3 && (
                          <li className="text-xs text-gray-400 italic">+{work.description.length - 3} more items...</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2">
                    <StatusToggle
                      isActive={work.isActive !== false}
                      onClick={() => {
                        const updatedList = [...experienceData.workExperience];
                        updatedList[index] = { ...work, isActive: work.isActive === false ? true : false };
                        // Direct save
                        fetch('/api/experience', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ workExperience: updatedList })
                        }).then(res => {
                          if (res.ok) {
                            loadExperienceData();
                            showSuccess('Experience status updated.');
                          } else {
                            showError('Failed to update status.');
                          }
                        });
                      }}
                      className="mr-auto"
                    />
                    <button
                      onClick={() => handleEditItem(index)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(index)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {experienceData.workExperience.length === 0 && (
                <div className="col-span-1 lg:col-span-2 text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">
                  No work experience added yet.
                </div>
              )}
            </div>
          )}
        </section>
      </div >
    </AdminLayout >
  );
}
