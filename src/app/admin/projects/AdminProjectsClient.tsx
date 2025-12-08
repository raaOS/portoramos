'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Project, CreateProjectData, UpdateProjectData, GalleryItem } from '@/types/projects';
import { isVideoLink } from '@/lib/images';
import { Pencil, Trash2, CheckCircle2, Clock4, Plus, Search, X } from 'lucide-react';

// Import design system components
import AdminButton from '../components/AdminButton';
import AdminModal from '../components/AdminModal';
import StatusToggle from '../components/StatusToggle';
import { useToast } from '@/contexts/ToastContext';

const FALLBACK_IMAGE = 'https://via.placeholder.com/400x300/CCCCCC/666666?text=No+Image';

export default function AdminProjectsClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
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
    setTogglingId(project.id);
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
    } finally {
      setTogglingId(null);
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

  // Filter projects
  const filteredProjects = projects
    .filter(project =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-violet-500 focus:border-violet-500 sm:text-sm transition duration-150 ease-in-out"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Add Project
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <X className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 text-lg mb-2">No projects found</p>
          <p className="text-gray-400 text-sm">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const isPublished = project.status === 'published';
            const isToggling = togglingId === project.id;

            return (
              <div key={project.id} className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden">
                {/* Cover Image/Video */}
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                  {isVideoLink(project.cover) ? (
                    <video
                      src={project.cover}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <Image
                      src={project.cover || FALLBACK_IMAGE}
                      alt={project.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      unoptimized
                    />
                  )}

                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{project.title}</h3>
                    <p className="text-sm text-violet-600 font-medium mb-2">{project.client} • {project.year}</p>
                    <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                    <StatusToggle
                      isActive={isPublished}
                      onClick={() => handleToggleProjectStatus(project)}
                      className={isToggling ? 'opacity-50 cursor-not-allowed' : ''}
                      labelActive="Published"
                      labelInactive="Draft"
                    />
                    <button
                      onClick={() => setEditingProject(project)}
                      className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                      title="Edit Project"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
    gallery: project?.gallery?.join('\\n') || '',
    galleryItems: project?.galleryItems || (project?.gallery || []).map(url => ({
      kind: isVideoLink(url) ? 'video' : 'image',
      src: url,
      isActive: true
    })) as GalleryItem[],
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
      gallery: project?.gallery?.join('\\n') || '',
      galleryItems: project?.galleryItems || (project?.gallery || []).map(url => ({
        kind: isVideoLink(url) ? 'video' : 'image',
        src: url,
        isActive: true
      })) as GalleryItem[],
      tags: project?.tags?.join(', ') || '',
      external_link: project?.external_link || '',
      autoplay: project?.autoplay ?? true,
      muted: project?.muted ?? true,
      loop: project?.loop ?? true,
      playsInline: project?.playsInline ?? true
    });
  }, [project]);

  const [imageDimensions, setImageDimensions] = useState<{ width: number, height: number } | null>(null);
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
      gallery: formData.galleryItems.map(item => item.src), // Support legacy
      galleryItems: formData.galleryItems,
      ...(project && { id: project.id })
    };

    await onSubmit(submitData as CreateProjectData | UpdateProjectData);
  };

  const handleButtonClick = () => {
    // Create a synthetic event for handleSubmit
    const syntheticEvent = {
      preventDefault: () => { },
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

  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  const handleAddGalleryUrl = () => {
    const url = newGalleryUrl.trim();
    if (!url) return;

    // Check for duplicates
    if (formData.galleryItems.some(item => item.src === url)) {
      setNewGalleryUrl('');
      return;
    }

    const newItem: GalleryItem = {
      kind: isVideoLink(url) ? 'video' : 'image',
      src: url,
      isActive: true
    };

    setFormData(prev => ({
      ...prev,
      galleryItems: [...prev.galleryItems, newItem]
    }));
    setNewGalleryUrl('');
  };

  const handleRemoveGalleryItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      galleryItems: prev.galleryItems.filter((_, i) => i !== index)
    }));
  };

  const handleToggleGalleryItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      galleryItems: prev.galleryItems.map((item, i) =>
        i === index ? { ...item, isActive: !item.isActive } : item
      )
    }));
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.title ? 'border-red-300 ring-red-200' : 'border-gray-300'
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.client ? 'border-red-300' : 'border-gray-300'
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.year ? 'border-red-300' : 'border-gray-300'
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
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
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.description ? 'border-red-300' : 'border-gray-300'
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
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.cover ? 'border-red-300' : 'border-gray-300'
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
              min="100"
              max="4000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover Height (px)
            </label>
            <input
              type="number"
              value={formData.coverHeight}
              onChange={(e) => handleInputChange('coverHeight', parseInt(e.target.value) || 600)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
              min="100"
              max="4000"
            />
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Tambah URL Cloudinary lalu klik +"
            />
            <AdminButton type="button" onClick={handleAddGalleryUrl}>
              +
            </AdminButton>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {formData.galleryItems.length} items. Supports On/Off toggle.
          </p>
          {formData.galleryItems.length > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {formData.galleryItems.map((item, index) => (
                <div key={`${item.src}-${index}`} className={`relative flex flex-col rounded-lg border overflow-hidden bg-white ${item.isActive !== false ? 'border-gray-200' : 'border-red-300 opacity-75'}`}>
                  {/* Media Preview */}
                  <div className="relative w-full pb-[75%] bg-gray-50 border-b border-gray-100">
                    {item.kind === 'video' ? (
                      <video src={item.src} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
                    ) : (
                      <Image
                        src={item.src}
                        alt="Gallery preview"
                        fill
                        className="object-cover"
                        sizes="120px"
                        unoptimized
                      />
                    )}
                  </div>

                  {/* Controls Footer */}
                  <div className="p-2 flex items-center justify-between gap-2 bg-white">
                    <StatusToggle
                      isActive={item.isActive !== false}
                      onClick={() => handleToggleGalleryItem(index)}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryItem(index)}
                      className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
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
                className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
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
                className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
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
                className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
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
