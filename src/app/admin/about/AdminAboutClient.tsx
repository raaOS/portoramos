'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { AboutData, UpdateAboutData, TrailItem } from '@/types/about';

import { Project } from '@/types/projects';
import TrailSelector from '@/components/admin/TrailSelector';

import AdminLayout from '../components/AdminLayout';
import { useToast } from '@/contexts/ToastContext';
import { useSearchParams } from 'next/navigation';
import { Sparkles, BriefcaseBusiness, Smile, Dumbbell, Info, Trash2, Pencil, Tag, Globe, Terminal, Palette, Monitor, Layout, MessageSquare, Save, User, Type, Plus, Eye, EyeOff } from 'lucide-react';
import RunningTextPanel from './components/RunningTextPanel';
import StatusToggle from '../components/StatusToggle';
import DesignPhilosophyForm from '@/components/admin/about/DesignPhilosophyForm';

import HardSkillsManager from './components/HardSkillsManager';
import { RunningTextItem } from '@/types/runningText';

import WallpaperManager from './components/WallpaperManager';
import DesktopProjectsForm from './components/DesktopProjectsForm';
import DockConfigForm from './components/DockConfigForm';
import ChatSettingsForm from './components/ChatSettingsForm';
import StickyNotesManager from './components/StickyNotesManager';
import NotificationsManager from './components/NotificationsManager';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AboutIslandNotification } from '@/types/about';

export default function AdminAboutClient() {
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { csrfToken } = useAdminAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'professional' | 'softSkills' | 'hardSkills' | 'runningText' | 'philosophy' | 'labels' | 'desktop' | 'dock' | 'chat' | 'stickyNotes' | 'notifications'>('professional');

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['professional', 'softSkills', 'hardSkills', 'runningText', 'philosophy', 'labels', 'desktop', 'dock', 'chat', 'stickyNotes', 'notifications'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

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
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load about data');
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
    } catch (error) {
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
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        credentials: 'include', // Ensure cookies (admin_token) are sent
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await loadAboutData();
        setError(null);
        showSuccess('About content updated successfully.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        const msg = `Failed to update: ${errorData.error || response.statusText} (${response.status})`;
        setError(msg);
        showError(msg);
      }
    } catch (err) {
      const msg = `Failed to update: ${err instanceof Error ? err.message : 'Network error'}`;
      setError(msg);
      showError(msg);
    }
  }





  // Running Text Handlers
  const handleCreateRunningText = async (payload: { text: string; order?: number; isActive?: boolean }) => {
    try {
      const response = await fetch('/api/running-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        credentials: 'include',
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
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        credentials: 'include',
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
        headers: {
          'x-csrf-token': csrfToken
        },
        credentials: 'include'
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
        title="Kelola Konten About"
        subtitle="Kelola bagian halaman About"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'About' }]}
        titleIcon={<Info className="h-5 w-5" aria-hidden />}
        titleAccent="bg-blue-50 text-blue-700"
      >
        <div className="flex items-center justify-center py-10 text-sm text-gray-600">
          Memuat data about...
        </div>
      </AdminLayout>
    );
  }

  if (!aboutData) {
    // ... same error ...
    return (
      <AdminLayout
        title="Kelola Konten About"
        subtitle="Kelola bagian halaman About"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'About' }]}
        titleIcon={<Info className="h-5 w-5" aria-hidden />}
        titleAccent="bg-blue-50 text-blue-700"
      >
        <div className="flex items-center justify-center py-8">
          <p className="text-red-600">Gagal memuat data about</p>
        </div>
      </AdminLayout>
    );
  }

  return (

    <AdminLayout
      title="Kelola Konten About"
    >
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] w-full">
        {/* Content Area - Full Width */}
        <div className="bg-white">
          <div className="p-6 lg:p-8">

            {activeTab === 'professional' && (
              <ProfessionalSectionForm
                data={aboutData.professional}
                heroData={aboutData.hero}
                projects={projects}
                onUpdate={(data) => handleUpdateAbout(data)}
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
            {activeTab === 'philosophy' && (
              <DesignPhilosophyForm />
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

            {/* OS Configuration Sections */}
            {activeTab === 'desktop' && (
              <div className="space-y-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-blue-800 flex items-center gap-2">
                    <Monitor className="w-5 h-5" /> Konfigurasi Desktop OS
                  </h3>
                  <p className="text-sm text-blue-600 mt-1">
                    Start Menu, Icon Desktop, dan perilaku Window.
                  </p>
                </div>
                <WallpaperManager
                  data={aboutData.wallpaperConfig}
                  onUpdate={(data) => handleUpdateAbout({ wallpaperConfig: data })}
                />
                <DesktopProjectsForm
                  projects={projects}
                  data={aboutData.desktopPreferences}
                  onUpdate={(data) => handleUpdateAbout({ desktopPreferences: data })}
                />
              </div>
            )}

            {activeTab === 'dock' && (
              <div className="space-y-8">
                <DockConfigForm
                  data={aboutData?.dockConfig || {}}
                  onUpdate={(data) => handleUpdateAbout({ dockConfig: data })}
                />
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="space-y-8">
                <ChatSettingsForm
                  data={aboutData.chatSettings}
                  onUpdate={(data) => handleUpdateAbout({ chatSettings: data })}
                />
              </div>
            )}

            {activeTab === 'stickyNotes' && (
              <div className="space-y-8">
                <StickyNotesManager />
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <NotificationsManager
                  notifications={aboutData?.islandNotifications || []}
                  onUpdate={(data: AboutIslandNotification[]) => handleUpdateAbout({ islandNotifications: data })}
                />
              </div>
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

// Professional Section Form
function ProfessionalSectionForm({
  data,
  heroData,
  projects,
  onUpdate
}: {
  data: any;
  heroData: any;
  projects: Project[];
  onUpdate: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    mottoBadge: data.motto?.badge || '',
    mottoQuote: data.motto?.quote || '',
    bioContent: data.bio?.content || '',
    // Availability
    availStatus: heroData?.availability?.status || 'available',
    availText: heroData?.availability?.text || 'Available for new projects'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      professional: {
        motto: {
          badge: formData.mottoBadge,
          quote: formData.mottoQuote
        },
        bio: {
          content: formData.bioContent
        }
      },
      hero: {
        availability: {
          status: formData.availStatus,
          text: formData.availText
        }
      }
    };

    onUpdate(submitData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tentang Saya & Status Header</h3>
        <p className="text-sm text-gray-600 mb-4">Konten ini muncul di window &quot;Finder: About Me&quot; pada halaman About OS.</p>
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-6">

          {/* Availability Status Section */}
          <div className="bg-white p-4 rounded border border-gray-200">
            <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Status Ketersediaan</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.availStatus}
                  onChange={(e) => setFormData({ ...formData, availStatus: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="available">Available (Green)</option>
                  <option value="booked">Booked (Red)</option>
                  <option value="limited">Limited (Red)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teks Status</label>
                <input
                  type="text"
                  value={formData.availText}
                  onChange={(e) => setFormData({ ...formData, availText: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Badge Motto</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.mottoBadge}
                onChange={(e) => setFormData({ ...formData, mottoBadge: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Kutipan Motto</label>
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
            <label className="block text-sm font-medium text-gray-700">Konten Bio</label>
            <textarea
              rows={4}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.bioContent}
              onChange={(e) => setFormData({ ...formData, bioContent: e.target.value })}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium shadow-sm"
            >
              Perbarui Info & Status
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
  // Initialize items by zipping texts and descriptions OR using new items array
  const initializeItems = () => {
    if (data.items && Array.isArray(data.items)) {
      return data.items.map((i: any) => ({
        text: i.text || '',
        description: i.description || '',
        isDraft: i.isDraft || false
      }));
    }

    // Fallback migration for old data
    const texts = data.texts || [];
    const descriptions = data.descriptions || [];
    const maxLength = Math.max(texts.length, descriptions.length);
    const items = [];

    for (let i = 0; i < maxLength; i++) {
      items.push({
        text: texts[i] || '',
        description: descriptions[i] || '',
        isDraft: false // Default to published for migrated items
      });
    }

    if (items.length === 0) {
      items.push({ text: '', description: '', isDraft: false });
    }

    return items;
  };

  const [items, setItems] = useState<{ text: string; description: string; isDraft: boolean }[]>(initializeItems);

  const handleItemChange = (index: number, field: 'text' | 'description', value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const toggleDraft = (index: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], isDraft: !newItems[index].isDraft };
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, { text: '', description: '', isDraft: true }]); // Default new items to Draft
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty items
    const validItems = items.filter(item => item.text.trim() || item.description.trim());

    // Save as new 'items' structure
    const submitData = {
      items: validItems
    };

    onUpdate(submitData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Soft Skills</h3>
        <p className="text-sm text-gray-600 mb-4">Daftar soft skills yang ditampilkan dalam bentuk morphing text.</p>
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-6">

          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className={`flex gap-4 items-start p-3 border rounded-md shadow-sm group transition-colors relative ${item.isDraft ? 'bg-gray-50 border-dashed border-gray-300 opacity-75' : 'bg-white border-gray-200'
                  }`}
              >
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Nama Skill (Teks)
                      </label>
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => handleItemChange(index, 'text', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="e.g. Kreativitas & Inovasi"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleDraft(index)}
                      className={`p-2 rounded-lg mt-5 transition-colors ${item.isDraft
                        ? 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      title={item.isDraft ? "Currently Draft (Hidden)" : "Currently Published (Visible)"}
                    >
                      {item.isDraft ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-5 h-fit"
                      title="Remove Skill"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Deskripsi
                    </label>
                    <textarea
                      rows={2}
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Jelaskan skill ini..."
                      required
                    />
                  </div>
                </div>

                {/* Visual Badge for Draft status */}
                <div className="absolute top-2 right-2 pointer-events-none">
                  {item.isDraft && (
                    <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">Draft</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Skill Baru
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium shadow-sm transition-colors"
            >
              Perbarui Soft Skills
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
