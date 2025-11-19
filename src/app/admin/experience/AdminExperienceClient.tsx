'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ExperienceData } from '@/types/experience';
import AdminTable from '../components/AdminTable';
import AdminButton from '../components/AdminButton';
import AdminLayout from '../components/AdminLayout';
import { useAutoUpdate } from '@/hooks/useAutoUpdate';
import { useToast } from '@/contexts/ToastContext';

export default function AdminExperienceClient() {
  const [experienceData, setExperienceData] = useState<ExperienceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ExperienceData>>({});
  const { showSuccess, showError } = useToast();

  // Load experience data
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

  const { lastUpdated, refresh } = useAutoUpdate(loadExperienceData);

  useEffect(() => {
    loadExperienceData();
  }, [lastUpdated]);

  // Update statistics
  const handleUpdateStatistics = async () => {
    if (!experienceData) return;

    try {
      const response = await fetch('/api/experience', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statistics: formData.statistics || experienceData.statistics
        })
      });

      if (response.ok) {
        setEditingField(null);
        setFormData({});
        refresh();
        showSuccess('Experience statistics updated successfully.');
      } else {
        showError('Failed to update statistics.');
      }
    } catch (error) {
      console.error('Error updating statistics:', error);
      showError('Failed to update statistics.');
    }
  };

  // Update work experience
  const handleUpdateWorkExperience = async () => {
    if (!experienceData) return;

    try {
      const response = await fetch('/api/experience', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workExperience: formData.workExperience || experienceData.workExperience
        })
      });

      if (response.ok) {
        setEditingField(null);
        setFormData({});
        refresh();
        showSuccess('Work experience updated successfully.');
      } else {
        showError('Failed to update work experience.');
      }
    } catch (error) {
      console.error('Error updating work experience:', error);
      showError('Failed to update work experience.');
    }
  };

  // Edit statistics
  const handleEditStatistics = () => {
    setEditingField('statistics');
    setFormData({ statistics: experienceData?.statistics });
  };

  // Edit work experience
  const handleEditWorkExperience = () => {
    setEditingField('workExperience');
    setFormData({ workExperience: experienceData?.workExperience });
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingField(null);
    setFormData({});
  };

  if (loading && !experienceData) {
    return (
      <AdminLayout
        title="Experience Management"
        subtitle="Manage experience statistics and work history"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Experience' }]}
      >
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500">Loading experience data...</p>
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
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Experience</h1>
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never'}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Statistics Section */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Statistics</h2>
            <AdminButton
              onClick={editingField === 'statistics' ? handleUpdateStatistics : handleEditStatistics}
              variant="primary"
            >
              {editingField === 'statistics' ? 'Save' : 'Edit'}
            </AdminButton>
          </div>

          {editingField === 'statistics' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience
                </label>
                <input
                type="text"
                value={formData.statistics?.years || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  statistics: { 
                    ...prev.statistics, 
                    years: e.target.value,
                    projects: prev.statistics?.projects || '',
                    designTools: prev.statistics?.designTools || '',
                    clientSatisfaction: prev.statistics?.clientSatisfaction || ''
                  }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Projects Completed
              </label>
              <input
                type="text"
                value={formData.statistics?.projects || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  statistics: { 
                    ...prev.statistics, 
                    years: prev.statistics?.years || '',
                    projects: e.target.value,
                    designTools: prev.statistics?.designTools || '',
                    clientSatisfaction: prev.statistics?.clientSatisfaction || ''
                  }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Design Tools
              </label>
              <input
                type="text"
                value={formData.statistics?.designTools || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  statistics: { 
                    ...prev.statistics, 
                    years: prev.statistics?.years || '',
                    projects: prev.statistics?.projects || '',
                    designTools: e.target.value,
                    clientSatisfaction: prev.statistics?.clientSatisfaction || ''
                  }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Satisfaction
              </label>
              <input
                type="text"
                value={formData.statistics?.clientSatisfaction || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  statistics: { 
                    ...prev.statistics, 
                    years: prev.statistics?.years || '',
                    projects: prev.statistics?.projects || '',
                    designTools: prev.statistics?.designTools || '',
                    clientSatisfaction: e.target.value
                  }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2 flex gap-2">
              <AdminButton onClick={handleUpdateStatistics} variant="primary">
                Save Changes
              </AdminButton>
              <AdminButton onClick={handleCancelEdit} variant="secondary">
                Cancel
              </AdminButton>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{experienceData.statistics.years}</div>
              <div className="text-sm text-gray-600">Years of Experience</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{experienceData.statistics.projects}</div>
              <div className="text-sm text-gray-600">Projects Completed</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{experienceData.statistics.designTools}</div>
              <div className="text-sm text-gray-600">Design Tools</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{experienceData.statistics.clientSatisfaction}</div>
              <div className="text-sm text-gray-600">Client Satisfaction</div>
            </div>
          </div>
        )}
      </div>

      {/* Work Experience Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Work Experience</h2>
          <AdminButton
            onClick={editingField === 'workExperience' ? handleUpdateWorkExperience : handleEditWorkExperience}
            variant="primary"
          >
            {editingField === 'workExperience' ? 'Save' : 'Edit'}
          </AdminButton>
        </div>

        {editingField === 'workExperience' ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Edit work experience entries. Each entry should have: position, company, year, and description array.
            </div>
            {formData.workExperience?.map((work, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="text-sm font-medium text-gray-700">Work Experience #{index + 1}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
                    <input
                      type="text"
                      value={work.position || ''}
                      onChange={(e) => {
                        const newWorkExperience = [...(formData.workExperience || [])];
                        newWorkExperience[index] = { ...work, position: e.target.value };
                        setFormData(prev => ({ ...prev, workExperience: newWorkExperience }));
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
                    <input
                      type="text"
                      value={work.company || ''}
                      onChange={(e) => {
                        const newWorkExperience = [...(formData.workExperience || [])];
                        newWorkExperience[index] = { ...work, company: e.target.value };
                        setFormData(prev => ({ ...prev, workExperience: newWorkExperience }));
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                    <input
                      type="text"
                      value={work.year || ''}
                      onChange={(e) => {
                        const newWorkExperience = [...(formData.workExperience || [])];
                        newWorkExperience[index] = { ...work, year: e.target.value };
                        setFormData(prev => ({ ...prev, workExperience: newWorkExperience }));
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
                    <input
                      type="text"
                      value={work.duration || ''}
                      onChange={(e) => {
                        const newWorkExperience = [...(formData.workExperience || [])];
                        newWorkExperience[index] = { ...work, duration: e.target.value };
                        setFormData(prev => ({ ...prev, workExperience: newWorkExperience }));
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g., 2 years, 6 months"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
                    <input
                      type="text"
                      value={work.imageUrl || ''}
                      onChange={(e) => {
                        const newWorkExperience = [...(formData.workExperience || [])];
                        newWorkExperience[index] = { ...work, imageUrl: e.target.value };
                        setFormData(prev => ({ ...prev, workExperience: newWorkExperience }));
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description (comma-separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(work.description) ? work.description.join(', ') : work.description || ''}
                      onChange={(e) => {
                        const newWorkExperience = [...(formData.workExperience || [])];
                        newWorkExperience[index] = { 
                          ...work, 
                          description: e.target.value.split(',').map(d => d.trim()).filter(d => d)
                        };
                        setFormData(prev => ({ ...prev, workExperience: newWorkExperience }));
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g., Led design team, Improved user experience, Managed projects"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <AdminButton
                    onClick={() => {
                      const newWorkExperience = formData.workExperience?.filter((_, i) => i !== index) || [];
                      setFormData(prev => ({ ...prev, workExperience: newWorkExperience }));
                    }}
                    variant="secondary"
                    className="text-xs px-2 py-1"
                  >
                    Remove
                  </AdminButton>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <AdminButton
                onClick={() => {
                  const newWorkExperience = [
                    ...(formData.workExperience || []),
                    { position: '', company: '', year: '', duration: '', description: [], imageUrl: '' }
                  ];
                  setFormData(prev => ({ ...prev, workExperience: newWorkExperience }));
                }}
                variant="secondary"
              >
                Add New Entry
              </AdminButton>
            </div>
            <div className="flex gap-2 pt-4 border-t">
              <AdminButton onClick={handleUpdateWorkExperience} variant="primary">
                Save Changes
              </AdminButton>
              <AdminButton onClick={handleCancelEdit} variant="secondary">
                Cancel
              </AdminButton>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {experienceData.workExperience.map((work, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="font-semibold text-lg">{work.position}</div>
                <div className="text-sm text-gray-600">{work.company} • {work.year} • {work.duration}</div>
                <div className="mt-2 text-sm">{work.description.join(', ')}</div>
                {work.imageUrl && (
                  <div className="mt-2">
                    <div className="relative w-16 h-16">
                      <Image
                        src={work.imageUrl}
                        alt={work.position}
                        fill
                        className="object-cover rounded"
                        sizes="64px"
                        unoptimized
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
