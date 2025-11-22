'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Project, CreateProjectData, UpdateProjectData } from '@/types/projects';
import { isVideoLink } from '@/lib/images';
import { Pencil, Trash2, CheckCircle2, Clock4 } from 'lucide-react';

// Import design system components
import AdminCard from '../components/AdminCard';
import AdminButton from '../components/AdminButton';
import AdminTable from '../components/AdminTableResponsive';
import AdminModal from '../components/AdminModal';
import AdminInput from '../components/AdminInput';
import AdminTextarea from '../components/AdminTextarea';
import { useToast } from '@/contexts/ToastContext';

const FALLBACK_IMAGE = 'https://via.placeholder.com/400x300/CCCCCC/666666?text=No+Image';

export default function AdminProjectsClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [sortKey, setSortKey] = useState<string>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { showSuccess: success, showError } = useToast();

  // Load projects on mount
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data.projects || []);
      setError(null);
    } catch (err) {
      setError('Failed to load projects');
      showError('Failed to load projects. Please try refreshing the page');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = async (projectData: CreateProjectData | UpdateProjectData) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });

      if (response.ok) {
        await loadProjects();
        setShowCreateForm(false);
        success('Project created successfully');
      } else {
        showError('Failed to create project. Please check your input and try again');
      }
    } catch (err) {
      showError('Failed to create project. Please try again');
    }
  };

  const handleUpdateProject = async (projectData: CreateProjectData | UpdateProjectData) => {
    try {
      const response = await fetch(`/api/projects/${(projectData as UpdateProjectData).id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });

      if (response.ok) {
        await loadProjects();
        setEditingProject(null);
        success('Project updated successfully');
      } else {
        showError('Failed to update project. Please check your input and try again');
      }
    } catch (err) {
      showError('Failed to update project. Please try again');
    }
  };

  const handleToggleProjectStatus = async (project: Project) => {
    const nextStatus = project.status === 'published' ? 'draft' : 'published';
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (response.ok) {
        await loadProjects();
        success(`Project marked as ${nextStatus}.`);
      } else {
        showError('Failed to update project status.');
      }
    } catch (err) {
      showError('Failed to update project status.');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadProjects();
        success('Project deleted successfully');
      } else {
        showError('Failed to delete project. Please try again');
      }
    } catch (err) {
      showError('Failed to delete project. Please try again');
    }
  };

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
  };

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = (a as any)[sortKey] ?? '';
      const bValue = (b as any)[sortKey] ?? '';
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

  const columns = [
    {
      key: 'cover',
      label: 'Preview',
      priority: 'high' as const,
      render: (cover: string) => (
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-100 relative">
          {isVideoLink(cover) ? (
            <video
              src={cover}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              preload="metadata"
              onError={(e) => {
                const target = e.target as HTMLVideoElement;
                target.style.display = 'none';
                const img = document.createElement('img');
                img.src = cover;
                img.className = 'w-full h-full object-cover';
                img.onerror = () => {
                  img.src = 'https://via.placeholder.com/400x300/CCCCCC/666666?text=No+Image';
                };
                target.parentNode?.appendChild(img);
              }}
            />
          ) : (
            <Image
              src={cover || FALLBACK_IMAGE}
              alt="Project cover"
              fill
              className="object-cover"
              sizes="64px"
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget;
                target.src = FALLBACK_IMAGE;
              }}
              unoptimized
            />
          )}
          {isVideoLink(cover) && (
            <div className="absolute top-0.5 right-0.5 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
              VIDEO
            </div>
          )}
        </div>
      )
    },
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      priority: 'high' as const,
      render: (title: string, project: Project) => (
        <div>
          <div className="font-medium text-gray-900 truncate">{title}</div>
          <div className="text-xs sm:text-sm text-gray-500 truncate">{project.slug}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      priority: 'high' as const,
      render: (status: Project['status'], project: Project) => {
        const published = status === 'published';
        return (
          <button
            type="button"
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${
              published
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-100 hover:bg-amber-100'
            }`}
            title="Toggle status"
            aria-label={published ? 'Set as Draft' : 'Set as Published'}
            onClick={() => handleToggleProjectStatus(project)}
          >
            {published ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : <Clock4 className="h-3.5 w-3.5" aria-hidden />}
            {published ? 'Published' : 'Draft'}
          </button>
        );
      }
    },
    {
      key: 'description',
      label: 'Description',
      hideOnMobile: true,
      priority: 'medium' as const,
      render: (description: string) => (
        <div className="max-w-xs truncate text-sm text-gray-600">
          {description}
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      hideOnMobile: true,
      priority: 'low' as const,
      render: (createdAt: string) => (
        <div className="text-sm text-gray-500">
          {new Date(createdAt).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      priority: 'high' as const,
      render: (_: any, project: Project) => (
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            type="button"
            onClick={() => setEditingProject(project)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition"
            aria-label="Edit project"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button
            type="button"
            onClick={() => handleDeleteProject(project.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 transition"
            aria-label="Delete project"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <AdminInput
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
        </div>
        <AdminButton
          onClick={() => setShowCreateForm(true)}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
          className="w-full sm:w-auto"
        >
          <span className="hidden sm:inline">Add Project</span>
          <span className="sm:hidden">Add New</span>
        </AdminButton>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Projects Table */}
      <AdminTable
        columns={columns}
        data={filteredProjects}
        loading={loading}
        emptyMessage="No projects found. Create your first project to get started."
        onSort={handleSort}
        sortKey={sortKey}
        sortDirection={sortDirection}
      />

      {/* Create Project Modal */}
      {showCreateForm && (
        <ProjectForm
          onSubmit={handleCreateProject}
          onCancel={() => setShowCreateForm(false)}
          title="Create New Project"
        />
      )}
      

      {/* Edit Project Modal */}
      {editingProject && (
        <ProjectForm
          project={editingProject}
          onSubmit={handleUpdateProject}
          onCancel={() => setEditingProject(null)}
          title="Edit Project"
        />
      )}
    </div>
  );
}

// Project Form Component
interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: CreateProjectData | UpdateProjectData) => Promise<void>;
  onCancel: () => void;
  title: string;
}

function ProjectForm({ project, onSubmit, onCancel, title }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    title: project?.title || '',
    client: project?.client || '',
    year: project?.year || new Date().getFullYear(),
    description: project?.description || '',
    cover: project?.cover || '',
    coverWidth: project?.coverWidth || 800,
    coverHeight: project?.coverHeight || 600,
    gallery: project?.gallery?.join('\n') || '',
    tags: project?.tags?.join(', ') || '',
    external_link: project?.external_link || '',
    autoplay: project?.autoplay ?? true,
    muted: project?.muted ?? true,
    loop: project?.loop ?? true,
    playsInline: project?.playsInline ?? true
  });

  // Reset form when project changes
  useEffect(() => {
    setFormData({
      title: project?.title || '',
      client: project?.client || '',
      year: project?.year || new Date().getFullYear(),
      description: project?.description || '',
      cover: project?.cover || '',
      coverWidth: project?.coverWidth || 800,
      coverHeight: project?.coverHeight || 600,
      gallery: project?.gallery?.join('\n') || '',
      tags: project?.tags?.join(', ') || '',
      external_link: project?.external_link || '',
      autoplay: project?.autoplay ?? true,
      muted: project?.muted ?? true,
      loop: project?.loop ?? true,
      playsInline: project?.playsInline ?? true
    });
  }, [project]);

  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null);
  const [isDetectingDimensions, setIsDetectingDimensions] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Function to detect image/video dimensions
  const detectImageDimensions = async (url: string) => {
    if (!url || !url.startsWith('http')) return;
    
    setIsDetectingDimensions(true);
    setImageDimensions(null);
    
    try {
      // Check if it's a video URL
      const isVideo = url.includes('/video/') || 
                     url.endsWith('.mp4') || 
                     url.endsWith('.mov') || 
                     url.endsWith('.webm') ||
                     url.includes('player.cloudinary.com');
      
      if (isVideo) {
        // For video, we need to create a video element to get dimensions
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.preload = 'metadata';
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            setIsDetectingDimensions(false);
            reject(new Error('Video loading timeout'));
          }, 10000); // 10 second timeout
          
          video.onloadedmetadata = () => {
            clearTimeout(timeout);
            const dimensions = {
              width: video.videoWidth,
              height: video.videoHeight
            };
            setImageDimensions(dimensions);
            
            // Auto-update form data with detected dimensions
            setFormData(prev => ({
              ...prev,
              coverWidth: dimensions.width,
              coverHeight: dimensions.height
            }));
            
            setIsDetectingDimensions(false);
            resolve(true);
          };
          
          video.onerror = (e) => {
            clearTimeout(timeout);
            console.warn('Video loading failed, trying fallback method:', e);
            // Fallback: try to extract dimensions from URL if it's Cloudinary
            if (url.includes('res.cloudinary.com')) {
              // For Cloudinary videos, we can try to get dimensions from URL parameters
              // or use default video dimensions
              const fallbackDimensions = { width: 1080, height: 1920 }; // Common video ratio
              setImageDimensions(fallbackDimensions);
              setFormData(prev => ({
                ...prev,
                coverWidth: fallbackDimensions.width,
                coverHeight: fallbackDimensions.height
              }));
              setIsDetectingDimensions(false);
              resolve(true);
            } else {
              setIsDetectingDimensions(false);
              reject(new Error('Failed to load video'));
            }
          };
          
          video.src = url;
          video.load();
        });
      } else {
        // For images, use the browser Image constructor (client-side only)
        if (typeof window === 'undefined') {
          setIsDetectingDimensions(false);
          return;
        }

        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            const dimensions = {
              width: img.naturalWidth,
              height: img.naturalHeight
            };
            setImageDimensions(dimensions);
            
            // Auto-update form data with detected dimensions
            setFormData(prev => ({
              ...prev,
              coverWidth: dimensions.width,
              coverHeight: dimensions.height
            }));
            
            setIsDetectingDimensions(false);
            resolve(true);
          };
          
          img.onerror = () => {
            setIsDetectingDimensions(false);
            reject(new Error('Failed to load image'));
          };
          
          img.src = url;
        });
      }
    } catch (error) {
      console.error('Error detecting media dimensions:', error);
      setIsDetectingDimensions(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 2) {
      newErrors.title = 'Title must be at least 2 characters';
    }

    if (!formData.client.trim()) {
      newErrors.client = 'Client is required';
    }

    if (!formData.year || formData.year < 2000 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Year must be between 2000 and ' + (new Date().getFullYear() + 1);
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 5) {
      newErrors.description = 'Description must be at least 5 characters';
    }

    if (!formData.cover.trim()) {
      newErrors.cover = 'Cover image/video URL is required';
    } else if (!formData.cover.startsWith('http')) {
      newErrors.cover = 'Please enter a valid URL';
    }

    return newErrors;
  };

  const isFormValid = () => {
    const validationErrors = validateForm();
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const submitData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      gallery: formData.gallery.split('\n').map(url => url.trim()).filter(url => url),
      ...(project && { id: project.id })
    };

    await onSubmit(submitData as CreateProjectData | UpdateProjectData);
  };

  const handleButtonClick = () => {
    // Create a synthetic event for handleSubmit
    const syntheticEvent = {
      preventDefault: () => {},
    } as React.FormEvent;
    handleSubmit(syntheticEvent);
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    if (field === 'tags' && typeof value === 'string') {
      setFormData(prev => ({ ...prev, tags: value.toLowerCase() }));
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (field === 'cover' && typeof value === 'string') {
      detectImageDimensions(value);
    }
  };

  const galleryList = useMemo(() => {
    return formData.gallery
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);
  }, [formData.gallery]);

  const setGalleryList = (list: string[]) => {
    setFormData((prev) => ({ ...prev, gallery: list.join('\n') }));
  };

  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  const handleAddGalleryUrl = () => {
    const url = newGalleryUrl.trim();
    if (!url) return;
    if (galleryList.includes(url)) {
      setNewGalleryUrl('');
      return;
    }
    setGalleryList([...galleryList, url]);
    setNewGalleryUrl('');
  };

  const handleRemoveGalleryUrl = (url: string) => {
    const current = galleryList.filter((item) => item !== url);
    setGalleryList(current);
  };

  return (
    <AdminModal
      isOpen={true}
      onClose={onCancel}
      title={title}
      size="lg"
      actions={
        <div className="flex space-x-3">
          <AdminButton variant="secondary" onClick={onCancel}>
            Cancel
          </AdminButton>
          <AdminButton 
            onClick={handleButtonClick}
            disabled={!isFormValid()}
          >
            {project ? 'Update Project' : 'Create Project'}
          </AdminButton>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Project title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client *
            </label>
            <input
              type="text"
              value={formData.client}
              onChange={(e) => handleInputChange('client', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.client ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Client name"
            />
            {errors.client && (
              <p className="mt-1 text-sm text-red-600">{errors.client}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year *
            </label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => handleInputChange('year', parseInt(e.target.value) || new Date().getFullYear())}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.year ? 'border-red-300' : 'border-gray-300'
              }`}
              min="2000"
              max={new Date().getFullYear() + 1}
            />
            {errors.year && (
              <p className="mt-1 text-sm text-red-600">{errors.year}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="React, Next.js, TypeScript (comma separated)"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            rows={3}
            placeholder="Project description"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cover Image/Video URL *
          </label>
          <input
            type="url"
            value={formData.cover}
            onChange={(e) => handleInputChange('cover', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.cover ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="https://res.cloudinary.com/your-cloud/video/upload/v1234567/video.mp4"
          />
          {errors.cover && (
            <p className="mt-1 text-sm text-red-600">{errors.cover}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Use Cloudinary URL or direct image/video link. Supports .mp4, .mov, .webm for videos
          </p>
          {formData.cover && (
            <div className="mt-3 flex items-start gap-3">
              <div className="relative w-20 h-20 rounded border bg-gray-50 overflow-hidden">
                {isVideoLink(formData.cover) ? (
                  <video
                    src={formData.cover}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <Image
                    src={formData.cover || FALLBACK_IMAGE}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized
                  />
                )}
              </div>
              <div className="text-xs text-gray-600 break-all max-w-xs">{formData.cover}</div>
            </div>
          )}
          
          {/* Image Preview and Dimensions */}
          {formData.cover && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-3">
                <div className="relative w-16 h-16">
                  <Image
                    src={formData.cover || FALLBACK_IMAGE}
                    alt="Cover preview"
                    fill
                    className="object-cover rounded border"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                    }}
                    sizes="64px"
                    unoptimized
                  />
                </div>
                <div className="flex-1">
                  {isDetectingDimensions ? (
                    <p className="text-sm text-gray-500">
                      Detecting {formData.cover.includes('/video/') || formData.cover.endsWith('.mp4') ? 'video' : 'image'} dimensions...
                    </p>
                  ) : imageDimensions ? (
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Dimensions: {imageDimensions.width} × {imageDimensions.height}
                      </p>
                      <p className="text-xs text-gray-500">
                        Ratio: {(imageDimensions.width / imageDimensions.height).toFixed(2)}:1
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-green-600">
                          ✓ Auto-detected and saved to form
                        </p>
                        {formData.cover.includes('/video/') || formData.cover.endsWith('.mp4') ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Video</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Image</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Enter a valid URL to see dimensions</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover Width (px)
            </label>
            <input
              type="number"
              value={formData.coverWidth}
              onChange={(e) => handleInputChange('coverWidth', parseInt(e.target.value) || 800)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="100"
              max="4000"
            />
            <p className="mt-1 text-xs text-gray-500">
              Auto-detected from image URL
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover Height (px)
            </label>
            <input
              type="number"
              value={formData.coverHeight}
              onChange={(e) => handleInputChange('coverHeight', parseInt(e.target.value) || 600)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="100"
              max="4000"
            />
            <p className="mt-1 text-xs text-gray-500">
              Auto-detected from image URL
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gallery URLs
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={newGalleryUrl}
              onChange={(e) => setNewGalleryUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tambah URL lalu klik +"
            />
            <AdminButton type="button" onClick={handleAddGalleryUrl}>
              +
            </AdminButton>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {galleryList.length} URL unik - satu URL per item (image/video).
          </p>
          {galleryList.length > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {galleryList.map((url) => (
                <div key={url} className="relative w-full pb-[100%] rounded border bg-gray-50 overflow-hidden group">
                  {isVideoLink(url) ? (
                    <video src={url} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
                  ) : (
                    <Image
                      src={url}
                      alt="Gallery preview"
                      fill
                      className="object-cover"
                      sizes="120px"
                      unoptimized
                    />
                  )}
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-white/80 text-xs px-2 py-1 rounded shadow hover:bg-white"
                    onClick={() => handleRemoveGalleryUrl(url)}
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            External Link
          </label>
          <input
            type="url"
            value={formData.external_link}
            onChange={(e) => handleInputChange('external_link', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/live-demo"
          />
        </div>

        {/* Video Settings */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Video Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoplay"
                checked={formData.autoplay}
                onChange={(e) => handleInputChange('autoplay', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoplay" className="ml-2 block text-sm text-gray-700">
                Autoplay
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="muted"
                checked={formData.muted}
                onChange={(e) => handleInputChange('muted', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="muted" className="ml-2 block text-sm text-gray-700">
                Muted
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="loop"
                checked={formData.loop}
                onChange={(e) => handleInputChange('loop', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="loop" className="ml-2 block text-sm text-gray-700">
                Loop
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="playsInline"
                checked={formData.playsInline}
                onChange={(e) => handleInputChange('playsInline', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="playsInline" className="ml-2 block text-sm text-gray-700">
                Plays Inline
              </label>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            These settings apply to video content. Autoplay and muted are recommended for better user experience.
          </p>
        </div>
      </form>
    </AdminModal>
  );
}
