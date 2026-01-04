'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { AboutData, UpdateAboutData, TrailItem } from '@/types/about';

import { Project } from '@/types/projects';
import TrailSelector from '@/components/admin/TrailSelector';
import { HardSkillConcept } from '@/types/hardSkillConcept';
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
  const [hardSkillConcepts, setHardSkillConcepts] = useState<HardSkillConcept[]>([]);
  const [runningTexts, setRunningTexts] = useState<RunningTextItem[]>([]);

  const [hardSkillConceptsLoading, setHardSkillConceptsLoading] = useState(true);
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



  const loadHardSkillConcepts = useCallback(async () => {
    try {
      setHardSkillConceptsLoading(true);
      const response = await fetch('/api/hard-skills/concepts');
      const data = await response.json();
      setHardSkillConcepts(data.concepts || []);
    } catch (err) {
      showError('Failed to load hard skill concepts.');
    } finally {
      setHardSkillConceptsLoading(false);
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
    loadHardSkillConcepts();
    loadRunningTexts();
    loadProjects();
  }, [loadAboutData, loadHardSkillConcepts, loadRunningTexts, loadProjects]);

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



  // Hard Skill Concept Handlers...
  const handleCreateConcept = async (payload: any) => { /* ... existing ... */
    try {
      const response = await fetch('/api/hard-skills/concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        await loadHardSkillConcepts();
        showSuccess('Konsep hard skill berhasil ditambahkan.');
      } else {
        showError('Gagal menambahkan konsep hard skill.');
      }
    } catch (err) {
      showError('Gagal menambahkan konsep hard skill.');
    }
  };

  const handleUpdateConcept = async (id: string, payload: Partial<HardSkillConcept>) => {
    try {
      const response = await fetch(`/api/hard-skills/concepts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        await loadHardSkillConcepts();
        showSuccess('Konsep hard skill diperbarui.');
      } else {
        showError('Gagal memperbarui konsep hard skill.');
      }
    } catch (err) {
      showError('Gagal memperbarui konsep hard skill.');
    }
  };

  const handleDeleteConcept = async (id: string) => {
    try {
      const response = await fetch(`/api/hard-skills/concepts/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await loadHardSkillConcepts();
        showSuccess('Konsep hard skill dihapus.');
      } else {
        showError('Gagal menghapus konsep hard skill.');
      }
    } catch (err) {
      showError('Gagal menghapus konsep hard skill.');
    }
  };

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

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-3 px-6 overflow-x-auto py-2">
            {[
              { id: 'hero', name: 'Hero', icon: Sparkles, color: 'text-blue-600' },
              { id: 'professional', name: 'Professional', icon: BriefcaseBusiness, color: 'text-emerald-600' },
              { id: 'runningText', name: 'Running Text', icon: Type, color: 'text-pink-600' },
              { id: 'labels', name: 'Labels', icon: Tag, color: 'text-gray-600' },
              { id: 'softSkills', name: 'Soft Skills', icon: Smile, color: 'text-amber-600' },
              { id: 'hardSkills', name: 'Hard Skills', icon: Dumbbell, color: 'text-violet-600' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2 transition ${activeTab === tab.id ? `${tab.color} font-semibold` : 'text-gray-800'
                  }`}
                title={tab.name}
                aria-label={tab.name}
              >
                <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? tab.color : 'text-gray-700'}`} aria-hidden />
                <span className="font-semibold">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
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
              <div className="h-px bg-gray-200" />
              <HardSkillConceptsPanel
                concepts={hardSkillConcepts}
                loading={hardSkillConceptsLoading}
                onCreate={handleCreateConcept}
                onUpdate={handleUpdateConcept}
                onDelete={handleDeleteConcept}
              />
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


// Hard Skill Concepts Panel
function HardSkillConceptsPanel({
  concepts,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}: {
  concepts: HardSkillConcept[];
  loading: boolean;
  onCreate: (data: { title: string; description: string; order?: number; isActive?: boolean }) => void;
  onUpdate: (id: string, data: Partial<HardSkillConcept>) => void;
  onDelete: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    order: '' as string | number,
    isActive: true,
  });

  const sortedConcepts = concepts.slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate(editingId, {
        title: form.title,
        description: form.description,
        order: form.order === '' ? undefined : Number(form.order),
        isActive: form.isActive,
      });
      setEditingId(null);
    } else {
      onCreate({
        title: form.title,
        description: form.description,
        order: form.order === '' ? undefined : Number(form.order),
        isActive: form.isActive,
      });
    }
    setForm({ title: '', description: '', order: '', isActive: true });
  };

  const handleEdit = (concept: HardSkillConcept) => {
    setEditingId(concept.id);
    setForm({
      title: concept.title,
      description: concept.description,
      order: concept.order,
      isActive: concept.isActive !== false,
    });
    // Scroll to form
    const formElement = document.getElementById('concept-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ title: '', description: '', order: '', isActive: true });
  };

  return (
    <div className="space-y-8">
      <div id="concept-form">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium text-gray-900">{editingId ? 'Edit Konsep/Metodologi' : 'Tambah Konsep/Metodologi'}</h3>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Batal Edit
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-4">Tambahkan konsep tambahan atau metodologi yang Anda kuasai.</p>
        <form onSubmit={handleSubmit} className={`grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-4 rounded-lg border ${editingId ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="space-y-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Judul</label>
            <input
              type="text"
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Contoh: Design Thinking"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
            <textarea
              rows={3}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Order (opsional)</label>
            <input
              type="number"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
              placeholder={`${concepts.length + 1}`}
            />
          </div>
          <div className="space-y-1 flex items-center pt-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-sm font-medium text-gray-700">Aktifkan</span>
            </label>
          </div>
          <div className="flex items-end justify-end md:col-span-2 gap-2">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium shadow-sm transition-colors"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              className={`px-4 py-2 text-white rounded-md font-medium shadow-sm transition-colors ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-violet-600 hover:bg-violet-700'}`}
            >
              {editingId ? 'Simpan Perubahan' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Daftar Konsep</h3>
        {loading ? (
          <p className="text-sm text-gray-500">Memuat...</p>
        ) : sortedConcepts.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada konsep. Tambahkan di atas.</p>
        ) : (
          <div className="space-y-4">
            {sortedConcepts.map((concept) => (
              <div key={concept.id} className={`border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow ${editingId === concept.id ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-200'}`}>
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{concept.title}</h4>
                      <span className="text-xs text-gray-500">Order: {concept.order}</span>
                    </div>
                    <p className="text-sm text-gray-600">{concept.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(concept)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <StatusToggle
                      isActive={concept.isActive !== false}
                      onClick={() => onUpdate(concept.id, { isActive: !concept.isActive })}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Hapus konsep ini?')) onDelete(concept.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
