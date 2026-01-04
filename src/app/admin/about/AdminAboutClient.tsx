'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { AboutData, UpdateAboutData, TrailItem } from '@/types/about';

import { Project } from '@/types/projects';
import TrailSelector from '@/components/admin/TrailSelector';

import AdminLayout from '../components/AdminLayout';
import { useToast } from '@/contexts/ToastContext';
import { Sparkles, BriefcaseBusiness, Smile, Dumbbell, Info, Trash2, Pencil, Tag } from 'lucide-react';
import RunningTextPanel from './components/RunningTextPanel';
import StatusToggle from '../components/StatusToggle';

import HardSkillsManager from './components/HardSkillsManager';
import { RunningTextItem } from '@/types/runningText';
import { Type, ArrowUp, ArrowDown } from 'lucide-react';

export default function AdminAboutClient() {
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'hero' | 'professional' | 'softSkills' | 'hardSkills' | 'runningText' | 'labels'>('hero');

  const [projects, setProjects] = useState<Project[]>([]);

  const [runningTexts, setRunningTexts] = useState<RunningTextItem[]>([]);


  const [runningTextsLoading, setRunningTextsLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  const loadAboutData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/about');
      const data = await response.json();
      setAboutData(data);
    } catch (err) {
      setError('Failed to load about data');
      showError('Failed to load about content.');
    } finally {
      setLoading(false);
    }
  }, [showError]);





  const loadRunningTexts = useCallback(async () => {
    try {
      setRunningTextsLoading(true);
      const response = await fetch('/api/running-text');
      const data = await response.json();
      setRunningTexts(data.items || []);
    } catch (err) {
      showError('Failed to load running text.');
    } finally {
      setRunningTextsLoading(false);
    }
  }, [showError]);

  const loadProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Failed to load projects for selector', err);
    }
  }, []);

  useEffect(() => {
    loadAboutData();
    loadRunningTexts();
    loadProjects();
  }, [loadAboutData, loadRunningTexts, loadProjects]);

  const handleUpdateAbout = async (updateData: UpdateAboutData) => {
    try {
      const response = await fetch('/api/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await loadAboutData();
        setError(null);
        showSuccess('About content updated successfully.');
      } else {
        setError('Failed to update about data');
        showError('Failed to update about content.');
      }
    } catch (err) {
      setError('Failed to update about data');
      showError('Failed to update about content.');
    }
  }





  // Running Text Handlers
  const handleCreateRunningText = async (payload: { text: string; order?: number; isActive?: boolean }) => {
    try {
      const response = await fetch('/api/running-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        await loadRunningTexts();
        showSuccess('Running text berhasil ditambahkan.');
      } else {
        showError('Gagal menambahkan running text.');
      }
    } catch (err) {
      showError('Gagal menambahkan running text.');
    }
  };

  const handleUpdateRunningText = async (id: string, payload: Partial<RunningTextItem>) => {
    try {
      const response = await fetch(`/api/running-text/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        await loadRunningTexts();
        showSuccess('Running text diperbarui.');
      } else {
        showError('Gagal memperbarui running text.');
      }
    } catch (err) {
      showError('Gagal memperbarui running text.');
    }
  };

  const handleDeleteRunningText = async (id: string) => {
    try {
      const response = await fetch(`/api/running-text/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await loadRunningTexts();
        showSuccess('Running text dihapus.');
      } else {
        showError('Gagal menghapus running text.');
      }
    } catch (err) {
      showError('Gagal menghapus running text.');
    }
  };


  if (loading) {
    // ... same loading ...
    return (
      <AdminLayout
        title="About Content Management"
        subtitle="Manage About page sections"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'About' }]}
        titleIcon={<Info className="h-5 w-5" aria-hidden />}
        titleAccent="bg-blue-50 text-blue-700"
      >
        <div className="flex items-center justify-center py-10 text-sm text-gray-600">
          Loading about data...
        </div>
      </AdminLayout>
    );
  }

  if (!aboutData) {
    // ... same error ...
    return (
      <AdminLayout
        title="About Content Management"
        subtitle="Manage About page sections"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'About' }]}
        titleIcon={<Info className="h-5 w-5" aria-hidden />}
        titleAccent="bg-blue-50 text-blue-700"
      >
        <div className="flex items-center justify-center py-8">
          <p className="text-red-600">Failed to load about data</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="About Content Management"
      subtitle="Manage About page sections"
      breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'About' }]}
      titleIcon={<Info className="h-5 w-5" aria-hidden />}
      titleAccent="bg-blue-50 text-blue-700"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-semibold text-gray-900">Content Overview</h2>
        <div className="text-sm text-gray-500">
          Last updated: {new Date(aboutData.lastUpdated).toLocaleString()}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col md:flex-row">
        {/* Mobile Navigation (Dropdown) */}
        <div className="md:hidden p-4 border-b border-gray-200 bg-gray-50">
          <label htmlFor="tab-select" className="block text-sm font-medium text-gray-700 mb-2">
            Pilih Bagian
          </label>
          <div className="relative">
            <select
              id="tab-select"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as any)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              {[
                { id: 'hero', name: 'Hero Section' },
                { id: 'professional', name: 'Professional Info' },
                { id: 'softSkills', name: 'Soft Skills' },
                { id: 'hardSkills', name: 'Hard Skills' },
                { id: 'runningText', name: 'Running Text' },
              ].map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop Navigation (Sidebar) */}
        <div className="hidden md:block w-64 border-r border-gray-200 bg-gray-50/50 flex-shrink-0">
          <nav className="p-3 space-y-1">
            {[
              { id: 'hero', name: 'Hero Section', icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-50' },
              { id: 'professional', name: 'Professional', icon: BriefcaseBusiness, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { id: 'softSkills', name: 'Soft Skills', icon: Smile, color: 'text-amber-600', bg: 'bg-amber-50' },
              { id: 'hardSkills', name: 'Hard Skills', icon: Dumbbell, color: 'text-violet-600', bg: 'bg-violet-50' },
              { id: 'runningText', name: 'Running Text', icon: Type, color: 'text-pink-600', bg: 'bg-pink-50' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                    ? `${tab.bg} ${tab.color} shadow-sm ring-1 ring-inset ring-gray-200`
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                  <tab.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? tab.color : 'text-gray-400 group-hover:text-gray-500'}`} />
                  {tab.name}
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 bg-white">
          <div className="p-6 lg:p-8">
            {activeTab === 'hero' && (
              <HeroSectionForm
                data={aboutData.hero}
                projects={projects}
                onUpdate={(data) => handleUpdateAbout({ hero: data })}
              />
            )}
            {activeTab === 'professional' && (
              <ProfessionalSectionForm
                data={aboutData.professional}
                projects={projects}
                onUpdate={(data) => handleUpdateAbout({ professional: data })}
              />
            )}
            {activeTab === 'softSkills' && (
              <SoftSkillsSectionForm
                data={aboutData.softSkills}
                onUpdate={(data) => handleUpdateAbout({ softSkills: data })}
              />
            )}
            {activeTab === 'hardSkills' && (
              <div className="space-y-8">
                <HardSkillsManager />
              </div>
            )}
            {activeTab === 'runningText' && (
              <RunningTextPanel
                items={runningTexts}
                loading={runningTextsLoading}
                onCreate={handleCreateRunningText}
                onUpdate={handleUpdateRunningText}
                onDelete={handleDeleteRunningText}
              />
            )}
            {/* Note: Labels panel content seems missing in original code, placeholder removed if not used or add placeholder if needed */}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Helper untuk merapikan daftar URL (1 per baris, unik)
const normalizeUrlList = (raw: string) => {
  const urls = raw
    .split(/[\n,]+/)
    .map((u) => u.trim())
    .filter(Boolean);
  return Array.from(new Set(urls));
};

// Hero Section Form
function HeroSectionForm({
  data,
  projects,
  onUpdate
}: {
  data: any;
  projects: Project[];
  onUpdate: (data: any) => void;
}) {
  // Normalize initial data to TrailItem[]
  const initialTrail: TrailItem[] = (data.backgroundTrail || []).map((item: string | TrailItem) => {
    if (typeof item === 'string') {
      return { src: item, isActive: true };
    }
    return item;
  });

  const [formData, setFormData] = useState({
    title: data.title || '',
    backgroundTrail: initialTrail
  });

  const handleTrailChange = (items: TrailItem[]) => {
    setFormData(prev => ({
      ...prev,
      backgroundTrail: items
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      title: formData.title,
      backgroundTrail: formData.backgroundTrail
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Hero Section</h3>
        <p className="text-sm text-gray-600 mb-4">Atur judul utama dan efek trail di background.</p>
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-6">

          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Background Trail Images</label>
            <TrailSelector
              projects={projects}
              selectedItems={formData.backgroundTrail}
              onChange={handleTrailChange}
              maxItems={20}
              allowedTypes={['image']}
            />
            <p className="mt-2 text-sm text-gray-500">
              {formData.backgroundTrail.length} items.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium shadow-sm"
            >
              Update Hero Section
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Professional Section Form
function ProfessionalSectionForm({
  data,
  projects,
  onUpdate
}: {
  data: any;
  projects: Project[];
  onUpdate: (data: any) => void;
}) {
  // Normalize initial data to TrailItem[]
  const initialGallery: TrailItem[] = (data.bio?.galleryImages || []).map((item: string | TrailItem) => {
    if (typeof item === 'string') {
      return { src: item, isActive: true };
    }
    return item;
  });

  const [formData, setFormData] = useState({
    mottoBadge: data.motto?.badge || '',
    mottoQuote: data.motto?.quote || '',
    bioContent: data.bio?.content || '',
    bioGalleryImages: initialGallery
  });

  const handleGalleryChange = (items: TrailItem[]) => {
    setFormData(prev => ({
      ...prev,
      bioGalleryImages: items
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      motto: {
        badge: formData.mottoBadge,
        quote: formData.mottoQuote
      },
      bio: {
        content: formData.bioContent,
        galleryImages: formData.bioGalleryImages
      }
    };

    onUpdate(submitData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Professional Information</h3>
        <p className="text-sm text-gray-600 mb-4">Informasi tentang motto kerja dan biografi singkat.</p>
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Motto Badge</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.mottoBadge}
                onChange={(e) => setFormData({ ...formData, mottoBadge: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Motto Quote</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.mottoQuote}
                onChange={(e) => setFormData({ ...formData, mottoQuote: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Bio Content</label>
            <textarea
              rows={4}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.bioContent}
              onChange={(e) => setFormData({ ...formData, bioContent: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio Gallery Images</label>
            <TrailSelector
              projects={projects}
              selectedItems={formData.bioGalleryImages}
              onChange={handleGalleryChange}
              maxItems={20}
            />
            <p className="mt-2 text-sm text-gray-500">
              {formData.bioGalleryImages.length} items.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium shadow-sm"
            >
              Update Professional Info
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Soft Skills Section Form
function SoftSkillsSectionForm({
  data,
  onUpdate
}: {
  data: any;
  onUpdate: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    texts: data.texts?.join('\n') || '',
    descriptions: data.descriptions?.join('\n') || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      texts: formData.texts.split('\n').filter(Boolean),
      descriptions: formData.descriptions.split('\n').filter(Boolean)
    };

    onUpdate(submitData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Soft Skills</h3>
        <p className="text-sm text-gray-600 mb-4">Daftar soft skills yang ditampilkan dalam bentuk morphing text.</p>
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-6">

          <div>
            <label className="block text-sm font-medium text-gray-700">Skill Texts (one per line)</label>
            <textarea
              rows={6}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.texts}
              onChange={(e) => setFormData({ ...formData, texts: e.target.value })}
              placeholder="Kreativitas & Inovasi&#10;Problem Solving&#10;Team Collaboration"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Skill Descriptions (one per line)</label>
            <textarea
              rows={6}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.descriptions}
              onChange={(e) => setFormData({ ...formData, descriptions: e.target.value })}
              placeholder="Mampu menghasilkan ide-ide kreatif yang fresh dan inovatif untuk setiap project.&#10;Terbiasa menganalisis masalah dan menemukan solusi yang efektif dan efisien."
            />
            <p className="mt-1 text-sm text-gray-500">Make sure the number of descriptions matches the number of texts</p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium shadow-sm"
            >
              Update Soft Skills
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



