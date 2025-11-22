'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { AboutData, UpdateAboutData } from '@/types/about';
import { HardSkill, HardSkillLevel } from '@/types/hardSkill';
import { HardSkillConcept } from '@/types/hardSkillConcept';
import AdminLayout from '../components/AdminLayout';
import { useToast } from '@/contexts/ToastContext';
import { Sparkles, BriefcaseBusiness, Smile, Dumbbell, Info, Trash2 } from 'lucide-react';

export default function AdminAboutClient() {
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'hero' | 'professional' | 'softSkills' | 'hardSkills'>('hero');
  const [hardSkills, setHardSkills] = useState<HardSkill[]>([]);
  const [hardSkillConcepts, setHardSkillConcepts] = useState<HardSkillConcept[]>([]);
  const [hardSkillsLoading, setHardSkillsLoading] = useState(true);
  const [hardSkillConceptsLoading, setHardSkillConceptsLoading] = useState(true);
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

  const loadHardSkills = useCallback(async () => {
    try {
      setHardSkillsLoading(true);
      const response = await fetch('/api/hard-skills');
      const data = await response.json();
      setHardSkills(data.skills || []);
    } catch (err) {
      showError('Failed to load hard skills.');
    } finally {
      setHardSkillsLoading(false);
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

  useEffect(() => {
    loadAboutData();
    loadHardSkills();
    loadHardSkillConcepts();
  }, [loadAboutData, loadHardSkills, loadHardSkillConcepts]);

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

  const handleCreateHardSkill = async (payload: {
    name: string;
    iconUrl: string;
    level: HardSkillLevel;
    order?: number;
    description?: string;
  }) => {
    try {
      const response = await fetch('/api/hard-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        await loadHardSkills();
        showSuccess('Hard skill berhasil ditambahkan.');
      } else {
        showError('Gagal menambahkan hard skill.');
      }
    } catch (err) {
      showError('Gagal menambahkan hard skill.');
    }
  };

  const handleUpdateHardSkill = async (id: string, payload: Partial<HardSkill>) => {
    try {
      const response = await fetch(`/api/hard-skills/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        await loadHardSkills();
        showSuccess('Hard skill diperbarui.');
      } else {
        showError('Gagal memperbarui hard skill.');
      }
    } catch (err) {
      showError('Gagal memperbarui hard skill.');
    }
  };

  const handleDeleteHardSkill = async (id: string) => {
    try {
      const response = await fetch(`/api/hard-skills/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await loadHardSkills();
        showSuccess('Hard skill dihapus.');
      } else {
        showError('Gagal menghapus hard skill.');
      }
    } catch (err) {
      showError('Gagal menghapus hard skill.');
    }
  };

  const handleCreateConcept = async (payload: { title: string; description: string; order?: number }) => {
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

  if (loading) {
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
              { id: 'hero', name: 'Hero', icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-50' },
              { id: 'professional', name: 'Professional', icon: BriefcaseBusiness, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { id: 'softSkills', name: 'Soft Skills', icon: Smile, color: 'text-amber-600', bg: 'bg-amber-50' },
              { id: 'hardSkills', name: 'Hard Skills', icon: Dumbbell, color: 'text-violet-600', bg: 'bg-violet-50' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 border transition ${
                  activeTab === tab.id
                    ? `${tab.bg} ${tab.color} border-current shadow-sm`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                title={tab.name}
                aria-label={tab.name}
              >
                <span className={`p-1.5 rounded-lg ${tab.bg} ${tab.color} shadow-sm`}>
                  <tab.icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="font-semibold">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'hero' && (
            <HeroSectionForm 
              data={aboutData.hero} 
              onUpdate={(data) => handleUpdateAbout({ hero: data })} 
            />
          )}
          {activeTab === 'professional' && (
            <ProfessionalSectionForm 
              data={aboutData.professional} 
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
              <HardSkillsPanel
                skills={hardSkills}
                loading={hardSkillsLoading}
                onCreate={handleCreateHardSkill}
                onUpdate={handleUpdateHardSkill}
                onDelete={handleDeleteHardSkill}
              />
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
  onUpdate 
}: { 
  data: any;
  onUpdate: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    title: data.title || '',
    backgroundTrail: data.backgroundTrail?.join('\n') || ''
  });
  const [newTrailUrl, setNewTrailUrl] = useState('');

  const trailList = normalizeUrlList(formData.backgroundTrail);

  const addTrailUrl = () => {
    const url = newTrailUrl.trim();
    if (!url) return;
    if (trailList.includes(url)) {
      setNewTrailUrl('');
      return;
    }
    setFormData({ ...formData, backgroundTrail: [...trailList, url].join('\n') });
    setNewTrailUrl('');
  };

  const removeTrailUrl = (url: string) => {
    setFormData({
      ...formData,
      backgroundTrail: trailList.filter((u) => u !== url).join('\n')
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      title: formData.title,
      backgroundTrail: formData.backgroundTrail.split('\n').filter(Boolean)
    };

    onUpdate(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Hero Section</h3>
      
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
        <label className="block text-sm font-medium text-gray-700">Background Trail Images</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={newTrailUrl}
            onChange={(e) => setNewTrailUrl(e.target.value)}
            className="flex-1 mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://res.cloudinary.com/demo/image/upload/v1234567890/trail1.jpg"
          />
          <button
            type="button"
            onClick={addTrailUrl}
            className="mt-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            +
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {trailList.length} URL &middot; satu URL Cloudinary per item
        </p>
        {trailList.length > 0 && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {trailList.map((url) => (
              <div key={url} className="relative w-full pb-[70%] rounded-md border bg-gray-50 overflow-hidden group">
                <Image
                  src={url}
                  alt="Background preview"
                  fill
                  className="object-cover"
                  sizes="160px"
                  unoptimized
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-white/80 text-xs px-2 py-1 rounded shadow hover:bg-white"
                  onClick={() => removeTrailUrl(url)}
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Update Hero Section
        </button>
      </div>
    </form>
  );
}

// Professional Section Form
function ProfessionalSectionForm({ 
  data, 
  onUpdate 
}: { 
  data: any;
  onUpdate: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    mottoBadge: data.motto?.badge || '',
    mottoQuote: data.motto?.quote || '',
    bioContent: data.bio?.content || '',
    bioGalleryImages: data.bio?.galleryImages?.join('\n') || ''
  });
  const [newBioUrl, setNewBioUrl] = useState('');

  const bioList = normalizeUrlList(formData.bioGalleryImages);

  const addBioUrl = () => {
    const url = newBioUrl.trim();
    if (!url) return;
    if (bioList.includes(url)) {
      setNewBioUrl('');
      return;
    }
    setFormData({ ...formData, bioGalleryImages: [...bioList, url].join('\n') });
    setNewBioUrl('');
  };

  const removeBioUrl = (url: string) => {
    setFormData({
      ...formData,
      bioGalleryImages: bioList.filter((u) => u !== url).join('\n')
    });
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
        galleryImages: normalizeUrlList(formData.bioGalleryImages)
      }
    };

    onUpdate(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Professional Information</h3>
      
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
        <label className="block text-sm font-medium text-gray-700">Bio Gallery Images (one per line)</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={newBioUrl}
            onChange={(e) => setNewBioUrl(e.target.value)}
            className="flex-1 mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://res.cloudinary.com/demo/image/upload/v123/gallery1.jpg"
          />
          <button
            type="button"
            onClick={addBioUrl}
            className="mt-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            +
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {bioList.length} URL &middot; satu URL Cloudinary per item
        </p>
        {bioList.length > 0 && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {bioList.map((url) => (
              <div key={url} className="relative w-full pb-[70%] rounded-md border bg-gray-50 overflow-hidden group">
                <Image
                  src={url}
                  alt="Bio gallery preview"
                  fill
                  className="object-cover"
                  sizes="160px"
                  unoptimized
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-white/80 text-xs px-2 py-1 rounded shadow hover:bg-white"
                  onClick={() => removeBioUrl(url)}
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Update Professional Info
        </button>
      </div>
    </form>
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Soft Skills</h3>
      
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

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Update Soft Skills
        </button>
      </div>
    </form>
  );
}

// Hard Skills Panel
function HardSkillsPanel({
  skills,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}: {
  skills: HardSkill[];
  loading: boolean;
  onCreate: (data: { name: string; iconUrl: string; level: HardSkillLevel; order?: number; description?: string }) => void;
  onUpdate: (id: string, data: Partial<HardSkill>) => void;
  onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    iconUrl: '',
    level: 'Intermediate' as HardSkillLevel,
    order: '' as string | number,
    description: '',
  });

  const sortedSkills = skills.slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name: form.name,
      iconUrl: form.iconUrl,
      level: form.level,
      order: form.order === '' ? undefined : Number(form.order),
      description: form.description,
    });
    setForm({ name: '', iconUrl: '', level: 'Intermediate', order: '', description: '' });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tambah Hard Skill</h3>
        <p className="text-sm text-gray-600 mb-4">Gunakan URL ikon dari Cloudinary (disarankan SVG/PNG kecil).</p>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Nama</label>
            <input
              type="text"
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Level</label>
            <select
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value as HardSkillLevel })}
            >
              {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Icon URL (Cloudinary)</label>
            <input
              type="url"
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={form.iconUrl}
              onChange={(e) => setForm({ ...form, iconUrl: e.target.value })}
              placeholder="https://res.cloudinary.com/xxx/image/upload/v123/icon.png"
            />
            {form.iconUrl && (
              <div className="mt-2 flex items-start gap-3">
                <div className="relative w-14 h-14 rounded border bg-gray-50 overflow-hidden">
                  <Image
                    src={form.iconUrl}
                    alt="Icon preview"
                    fill
                    className="object-cover"
                    sizes="56px"
                    unoptimized
                  />
                </div>
                <div className="text-xs text-gray-600 break-all max-w-xs">{form.iconUrl}</div>
              </div>
            )}
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Deskripsi (opsional)</label>
            <textarea
              rows={2}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Penjelasan singkat skill ini..."
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Order (opsional)</label>
            <input
              type="number"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
              placeholder={`${skills.length + 1}`}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Tambah
            </button>
          </div>
        </form>
      </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Daftar Hard Skill</h3>
            {loading ? (
              <p className="text-sm text-gray-500">Memuat...</p>
            ) : sortedSkills.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada hard skill. Tambahkan di atas.</p>
            ) : (
              <div className="space-y-4">
                {sortedSkills.map((skill) => (
                  <div key={skill.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                    <div className="grid grid-cols-1 md:[grid-template-columns:1.1fr_0.9fr_1.5fr] gap-3 md:gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">Nama</label>
                        <input
                          type="text"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      defaultValue={skill.name}
                      onBlur={(e) => {
                        if (e.target.value !== skill.name) {
                          onUpdate(skill.id, { name: e.target.value });
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">Level</label>
                    <select
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      defaultValue={skill.level}
                      onChange={(e) => onUpdate(skill.id, { level: e.target.value as HardSkillLevel })}
                    >
                      {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700">Icon URL (Cloudinary)</label>
                    <input
                      type="url"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      defaultValue={skill.iconUrl}
                      onBlur={(e) => {
                        if (e.target.value !== skill.iconUrl) {
                          onUpdate(skill.id, { iconUrl: e.target.value });
                        }
                      }}
                    />
                    {skill.iconUrl && (
                      <div className="mt-2 flex items-start gap-3">
                        <div className="relative w-12 h-12 rounded border bg-gray-50 overflow-hidden">
                          <Image
                            src={skill.iconUrl}
                            alt={`${skill.name} icon`}
                            fill
                            className="object-cover"
                            sizes="48px"
                            unoptimized
                          />
                        </div>
                        <div className="text-xs text-gray-600 break-all max-w-xs">{skill.iconUrl}</div>
                      </div>
                    )}
                  </div>
                      <div className="space-y-1 md:col-span-3">
                        <label className="block text-xs font-medium text-gray-700">Deskripsi (opsional)</label>
                        <textarea
                          rows={2}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          defaultValue={skill.description || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (skill.description || '')) {
                              onUpdate(skill.id, { description: e.target.value });
                            }
                          }}
                          placeholder="Penjelasan singkat skill ini..."
                        />
                      </div>
                    </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-500">Order</div>
                    <input
                      type="number"
                      className="w-20 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      defaultValue={skill.order}
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (!Number.isNaN(val) && val !== skill.order) {
                          onUpdate(skill.id, { order: val });
                        }
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                    onClick={() => onDelete(skill.id)}
                    aria-label="Hapus skill"
                  >
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-red-600 text-white">
                      <Trash2 className="h-3 w-3" aria-hidden />
                    </span>
                    <span className="hidden sm:inline">Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HardSkillConceptsPanel({
  concepts,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}: {
  concepts: HardSkillConcept[];
  loading: boolean;
  onCreate: (data: { title: string; description: string; order?: number }) => void;
  onUpdate: (id: string, data: Partial<HardSkillConcept>) => void;
  onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    order: '' as string | number,
  });

  const sorted = concepts.slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      title: form.title,
      description: form.description,
      order: form.order === '' ? undefined : Number(form.order),
    });
    setForm({ title: '', description: '', order: '' });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tambah Poin Hard Skill</h3>
        <p className="text-sm text-gray-600 mb-4">Isi judul (mis. Tipografi) dan deskripsi singkat.</p>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Judul</label>
            <input
              type="text"
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
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
          <div className="space-y-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
            <textarea
              rows={3}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Penjelasan singkat skill ini..."
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Tambah
            </button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Daftar Poin Hard Skill</h3>
        {loading ? (
          <p className="text-sm text-gray-500">Memuat...</p>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada poin. Tambahkan di atas.</p>
        ) : (
          <div className="space-y-4">
            {sorted.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">Judul</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      defaultValue={item.title}
                      onBlur={(e) => {
                        if (e.target.value !== item.title) {
                          onUpdate(item.id, { title: e.target.value });
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">Order</label>
                    <input
                      type="number"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      defaultValue={item.order}
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (!Number.isNaN(val) && val !== item.order) {
                          onUpdate(item.id, { order: val });
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-3">
                    <label className="block text-xs font-medium text-gray-700">Deskripsi</label>
                    <textarea
                      rows={2}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      defaultValue={item.description}
                      onBlur={(e) => {
                        if (e.target.value !== item.description) {
                          onUpdate(item.id, { description: e.target.value });
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                    onClick={() => onDelete(item.id)}
                    aria-label="Hapus konsep"
                  >
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-red-600 text-white">
                      <Trash2 className="h-3 w-3" aria-hidden />
                    </span>
                    <span className="hidden sm:inline">Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
