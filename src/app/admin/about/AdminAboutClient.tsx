'use client';

import { useState, useEffect } from 'react';
import { AboutData, UpdateAboutData } from '@/types/about';
import AdminLayout from '../components/AdminLayout';
import { useToast } from '@/contexts/ToastContext';

export default function AdminAboutClient() {
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'hero' | 'professional' | 'softSkills'>('hero');
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadAboutData();
  }, []);

  const loadAboutData = async () => {
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
  };

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

  if (loading) {
    return null;
  }

  if (!aboutData) {
    return (
      <AdminLayout
        title="About Content Management"
        subtitle="Manage About page sections"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'About' }]}
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
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-semibold text-gray-900">About Content</h2>
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
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'hero', name: 'Hero Section' },
              { id: 'professional', name: 'Professional Info' },
              { id: 'softSkills', name: 'Soft Skills' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
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
        </div>
      </div>
    </AdminLayout>
  );
}
}

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
        <label className="block text-sm font-medium text-gray-700">Background Trail Images (one per line)</label>
        <textarea
          rows={6}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          value={formData.backgroundTrail}
          onChange={(e) => setFormData({ ...formData, backgroundTrail: e.target.value })}
          placeholder="https://res.cloudinary.com/demo/image/upload/v1234567890/trail1.jpg&#10;https://res.cloudinary.com/demo/image/upload/v1234567890/trail2.jpg"
        />
        <p className="mt-1 text-sm text-gray-500">Enter one Cloudinary URL per line</p>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      motto: {
        badge: formData.mottoBadge,
        quote: formData.mottoQuote
      },
      bio: {
        content: formData.bioContent,
        galleryImages: formData.bioGalleryImages.split('\n').filter(Boolean)
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
        <textarea
          rows={6}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          value={formData.bioGalleryImages}
          onChange={(e) => setFormData({ ...formData, bioGalleryImages: e.target.value })}
          placeholder="https://res.cloudinary.com/demo/image/upload/v1234567890/gallery1.jpg&#10;https://res.cloudinary.com/demo/image/upload/v1234567890/gallery2.jpg"
        />
        <p className="mt-1 text-sm text-gray-500">Enter one Cloudinary URL per line</p>
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
