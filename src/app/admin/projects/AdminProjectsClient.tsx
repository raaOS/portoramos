'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Project, CreateProjectData, UpdateProjectData, GalleryItem } from '@/types/projects';
import { isVideoLink } from '@/lib/images';
import { Pencil, Trash2, Plus, Search, X, Loader2, Settings, CheckCircle2, AlertCircle } from 'lucide-react';

// Import design system components
import AdminButton from '../components/AdminButton';
import AdminModal from '../components/AdminModal';
import StatusToggle from '../components/StatusToggle';
import { useToast } from '@/contexts/ToastContext';

const FALLBACK_IMAGE = 'https://via.placeholder.com/400x300/CCCCCC/666666?text=No+Image';

// Helper for UTF-8 Safe Base64
const utf8_to_b64 = (str: string) => {
  return window.btoa(unescape(encodeURIComponent(str)));
};

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export default function AdminProjectsClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSavingToGithub, setIsSavingToGithub] = useState(false);

  // GitHub Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [githubConfig, setGithubConfig] = useState<GitHubConfig | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error' | 'disconnected'>('disconnected');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Deployment Tracking State
  const [deployProgress, setDeployProgress] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [lastServerTime, setLastServerTime] = useState<string | null>(null);
  const [deployStatus, setDeployStatus] = useState<'idle' | 'pushing' | 'building' | 'live'>('idle');

  const { showSuccess: success, showError } = useToast();

  const verifyConnection = useCallback(async (config: GitHubConfig) => {
    setConnectionStatus('checking');
    setConnectionError(null);
    try {
      // Attempt to fetch file metadata (lightweight check)
      const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/src/data/projects.json`, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });

      if (res.ok) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
        if (res.status === 404) {
          setConnectionError('Repo not found (check Owner/Repo)');
        } else if (res.status === 401) {
          setConnectionError('Invalid Token');
        } else {
          setConnectionError(`Error: ${res.status}`);
        }
      }
    } catch (e) {
      console.error(e);
      setConnectionStatus('error');
      setConnectionError('Network Error');
    }
  }, []);

  // Load projects on mount
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);

      // Load GitHub Config
      const savedConfig = localStorage.getItem('github_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setGithubConfig(parsed);
        verifyConnection(parsed);
      }

      const response = await fetch('/api/projects');
      const data = await response.json();

      // LocalStorage Persistence Logic (Fix for "Revert on Refresh")
      // We check if we have a local cache that is NEWER or "pending" compared to server
      const localCache = localStorage.getItem('admin_projects_cache');
      let finalProjects = data.projects || [];

      if (localCache) {
        try {
          const parsedCache = JSON.parse(localCache);
          const localProjects = parsedCache?.projects || [];
          const timestamp = parsedCache?.timestamp || 0;

          const serverTime = data.lastUpdated ? new Date(data.lastUpdated).getTime() : 0;

          // If local cache is newer than server data (meaning Vercel hasn't finished deploy yet)
          if (timestamp > serverTime) {
            console.log('Using local cache because Vercel build is pending...');
            finalProjects = localProjects;
          }
        } catch (e) {
          console.error('Failed to parse local cache:', e);
          localStorage.removeItem('admin_projects_cache'); // Clear corrupted cache
        }
      }

      setProjects(finalProjects);
      setLastServerTime(data.lastUpdated);
      setError(null);
    } catch (err) {
      setError('Failed to load projects');
      showError('Failed to load projects. Please try refreshing the page');
    } finally {
      setLoading(false);
    }
  }, [showError, verifyConnection]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const saveGithubSettings = (config: GitHubConfig) => {
    localStorage.setItem('github_config', JSON.stringify(config));
    setGithubConfig(config);
    setShowSettings(false);
    verifyConnection(config); // Verify immediately
    success('GitHub settings saved!');
  };

  const triggerGithubSync = async (silent = false, projectsToSave: Project[] = projects) => {
    if (!githubConfig) {
      if (!silent) showError('Please configure GitHub settings first (click the gear icon).');
      setShowSettings(true);
      return;
    }

    if (!silent && !confirm('Save all changes to GitHub? This will trigger a deploy.')) return;

    setIsSavingToGithub(true);
    setDeployStatus('pushing');
    setDeployProgress(10);

    try {
      // 1. Fetch current SHA
      // We assume the file is at src/data/projects.json based on repo structure
      const getUrl = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/src/data/projects.json`;
      const getRes = await fetch(getUrl, {
        headers: {
          'Authorization': `Bearer ${githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        cache: 'no-store'
      });

      if (!getRes.ok) {
        if (getRes.status === 404) {
          throw new Error(`Repo or file not found. Check Owner/Repo names.`);
        }
        throw new Error(`Failed to fetch repo info: ${getRes.status} ${getRes.statusText}`);
      }

      const fileData = await getRes.json();
      const sha = fileData.sha;

      // 2. Prepare new content
      const newContent = JSON.stringify({
        projects: projectsToSave,
        lastUpdated: new Date().toISOString()
      }, null, 2);

      const encodedContent = utf8_to_b64(newContent);

      // 3. Push Update
      const putRes = await fetch(getUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Update projects via CMS (Client Direct)',
          content: encodedContent,
          sha: sha
        })
      });

      if (!putRes.ok) {
        const errData = await putRes.json();
        throw new Error(`GitHub Update Failed: ${errData.message || putRes.statusText}`);
      }

      if (!silent) success('Changes pushed to GitHub successfully!');
      startDeploymentTracking();

    } catch (err: any) {
      console.error(err);
      showError(err.message || 'Failed to save to GitHub.');
      setDeployStatus('idle');
      setDeployProgress(0);
    } finally {
      setIsSavingToGithub(false);
    }
  };

  const handleCreateProject = async (projectData: CreateProjectData | UpdateProjectData) => {
    // 1. Generate ID and optimistic object
    const newId = `project-${Date.now()}`;
    const newProject = {
      ...(projectData as CreateProjectData),
      id: newId,
      order: projects.length + 1,
      status: (projectData as CreateProjectData).status || 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Project;

    // 2. Optimistic Update (Immediate Feedback)
    const newProjects = [...projects, newProject];
    setProjects(newProjects);

    // Persist to localStorage immediately
    const newState = { projects: newProjects, timestamp: Date.now() };
    localStorage.setItem('admin_projects_cache', JSON.stringify(newState));
    setShowCreateForm(false);
    success('Project created (local)');

    // 3. Try to update backend (Non-blocking)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });

      if (!response.ok) {
        console.warn('Backend create failed (expected on Vercel), proceeding to sync.');
      }
    } catch (err) {
      console.warn('Backend create error', err);
    }

    // 4. Trigger GitHub Sync
    triggerGithubSync(true, newProjects);
  };

  const handleUpdateProject = async (projectData: CreateProjectData | UpdateProjectData) => {
    // 1. Optimistic Update
    const updatedProjects = projects.map(p =>
      p.id === (projectData as UpdateProjectData).id ? { ...p, ...projectData } as Project : p
    ); // Simple merge for optimistic

    setProjects(updatedProjects);
    const newState = { projects: updatedProjects, timestamp: Date.now() };
    localStorage.setItem('admin_projects_cache', JSON.stringify(newState));
    setEditingProject(null);
    success('Project updated (local)');

    // 2. Try to update backend (Non-blocking)
    try {
      const response = await fetch(`/api/projects/${(projectData as UpdateProjectData).id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });

      if (!response.ok) {
        console.warn('Backend update failed (expected on Vercel), proceeding to sync.');
      }
    } catch (err) {
      console.warn('Backend update error', err);
    }

    // 3. Trigger GitHub Sync
    triggerGithubSync(true, updatedProjects);
  };

  const handleToggleProjectStatus = async (project: Project) => {
    const nextStatus = project.status === 'published' ? 'draft' : 'published';
    setTogglingId(project.id);

    // 1. Optimistic Update
    const updatedProjects = projects.map(p =>
      p.id === project.id ? { ...p, status: nextStatus } as Project : p
    );
    setProjects(updatedProjects);

    // Persist
    const newState = { projects: updatedProjects, timestamp: Date.now() };
    localStorage.setItem('admin_projects_cache', JSON.stringify(newState));

    // 2. Try backend (Non-blocking)
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (err) {
      console.warn('Backend status update failed (expected on Vercel).');
    } finally {
      setTogglingId(null);
      // 3. Trigger Sync
      triggerGithubSync(true, updatedProjects);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    // 1. Optimistic Update
    const updatedProjects = projects.filter(p => p.id !== id);
    setProjects(updatedProjects);

    // Persist
    const newState = { projects: updatedProjects, timestamp: Date.now() };
    localStorage.setItem('admin_projects_cache', JSON.stringify(newState));
    success('Project deleted (local)');

    // 2. Try backend (Non-blocking)
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('Backend delete failed (expected on Vercel).');
    }

    // 3. Trigger Sync
    triggerGithubSync(true, updatedProjects);
  };

  // Filter projects
  const filteredProjects = projects
    .filter(project =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const startDeploymentTracking = () => {
    setIsDeploying(true);
    setDeployStatus('building');
    setDeployProgress(20);

    const simulationInterval = setInterval(() => {
      setDeployProgress(prev => {
        if (prev >= 90) return 90;
        return prev + 2;
      });
    }, 1500);

    const pollingInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects?t=${Date.now()}`);
        const data = await res.json();
        const serverTime = new Date(data.lastUpdated).getTime();
        const localKnownTime = lastServerTime ? new Date(lastServerTime).getTime() : 0;

        if (serverTime > localKnownTime) {
          clearInterval(simulationInterval);
          clearInterval(pollingInterval);

          setDeployProgress(100);
          setDeployStatus('live');
          setLastServerTime(data.lastUpdated);
          setIsDeploying(false);

          success('🚀 Deployment Complete! Your changes are live.');

          setTimeout(() => {
            setDeployStatus('idle');
            setDeployProgress(0);
          }, 5000);
        }
      } catch (e) {
        console.error('Polling failed', e);
      }
    }, 5000);

    setTimeout(() => {
      clearInterval(simulationInterval);
      clearInterval(pollingInterval);
      if (deployStatus !== 'live') {
        setIsDeploying(false);
        setDeployStatus('idle');
      }
    }, 180000);
  };


  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-2">
          {isSavingToGithub || isDeploying ? (
            <div className="flex items-center text-sm text-violet-600 bg-violet-50 px-3 py-1 rounded-full border border-violet-100">
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              {isSavingToGithub ? 'Syncing...' : 'Deploying...'}
            </div>
          ) : (
            <>
              {connectionStatus === 'connected' && (
                <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Connected
                </div>
              )}
              {connectionStatus === 'checking' && (
                <div className="flex items-center text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                  <Loader2 className="animate-spin w-3 h-3 mr-2" />
                  Checking...
                </div>
              )}
              {connectionStatus === 'error' && (
                <div className="flex items-center text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                  <AlertCircle className="w-3 h-3 mr-2" />
                  {connectionError || 'Connection Error'}
                </div>
              )}
            </>
          )}
        </div>
        <div className="relative flex-1 max-w-md flex gap-2">
          <div className="relative flex-1">
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
            onClick={() => setShowSettings(true)}
            className={`inline-flex items-center justify-center px-3 py-2 border text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${!githubConfig || connectionStatus === 'error' ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 ring-amber-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 ring-violet-500'
              }`}
            title="GitHub Settings"
          >
            <Settings className={`h-5 w-5 ${(!githubConfig || connectionStatus === 'error') ? 'animate-pulse' : ''}`} />
          </button>
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

      {/* GitHub Settings Modal */}
      {showSettings && (
        <SettingsModal
          initialConfig={githubConfig}
          onSave={saveGithubSettings}
          onCancel={() => setShowSettings(false)}
        />
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

// GitHub Settings Modal Component
function SettingsModal({ initialConfig, onSave, onCancel }: {
  initialConfig: GitHubConfig | null,
  onSave: (config: GitHubConfig) => void,
  onCancel: () => void
}) {
  const [config, setConfig] = useState<GitHubConfig>(initialConfig || {
    token: process.env.NEXT_PUBLIC_GITHUB_TOKEN || '', // from .env.local
    owner: 'raaOS', // default
    repo: 'portoramos' // default
  });

  const isComplete = config.token && config.owner && config.repo;

  return (
    <AdminModal
      isOpen={true}
      onClose={onCancel}
      title="GitHub Connection Settings"
      size="md"
      actions={
        <div className="flex space-x-3">
          <AdminButton variant="secondary" onClick={onCancel}>
            Cancel
          </AdminButton>
          <AdminButton
            onClick={() => onSave(config)}
            disabled={!isComplete}
          >
            Save Settings
          </AdminButton>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <p className="text-sm text-blue-800">
            To enable saving, you must provide a GitHub Personal Access Token.
            This token is stored securely in your browser and used to push updates directly to GitHub.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            GitHub Personal Access Token *
          </label>
          <input
            type="password"
            value={config.token}
            onChange={(e) => setConfig({ ...config, token: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="ghp_..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Owner / Username *
            </label>
            <input
              type="text"
              value={config.owner}
              onChange={(e) => setConfig({ ...config, owner: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g. raaos-projects"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Repo Name *
            </label>
            <input
              type="text"
              value={config.repo}
              onChange={(e) => setConfig({ ...config, repo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g. portfolio-shared"
            />
          </div>
        </div>
      </div>
    </AdminModal>
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
      gallery: project?.gallery?.join('\n') || '',
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
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
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
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.cover}
              onChange={(e) => handleInputChange('cover', e.target.value)}
              className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.cover ? 'border-red-300' : 'border-gray-300'
                }`}
              placeholder="https://..."
            />
            {isDetectingDimensions && (
              <div className="flex items-center px-2 text-violet-600">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}
          </div>
          {errors.cover && (
            <p className="mt-1 text-sm text-red-600">{errors.cover}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Cover Width</label>
            <input
              type="number"
              value={formData.coverWidth}
              readOnly
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-gray-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Cover Height</label>
            <input
              type="number"
              value={formData.coverHeight}
              readOnly
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-gray-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gallery Items
          </label>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newGalleryUrl}
              onChange={(e) => setNewGalleryUrl(e.target.value)}
              placeholder="Add image or video URL..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddGalleryUrl();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddGalleryUrl}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
            >
              Add
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {formData.galleryItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200 group">
                <div className="relative w-10 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                  {item.kind === 'video' ? (
                    <video src={item.src} className="w-full h-full object-cover" />
                  ) : (
                    <Image src={item.src} alt="" fill className="object-cover" unoptimized />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 truncate" title={item.src}>{item.src}</p>
                  <span className="text-[10px] uppercase font-bold text-gray-400">{item.kind}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleGalleryItem(index)}
                    className={`p-1 rounded ${item.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                    title={item.isActive ? "Active" : "Hidden"}
                  >
                    <CheckCircle2 className="w-4 h-4 ml-auto" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveGalleryItem(index)}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {formData.galleryItems.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-4 italic">No gallery items yet</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            External Link
          </label>
          <input
            type="text"
            value={formData.external_link}
            onChange={(e) => handleInputChange('external_link', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="https://example.com"
          />
        </div>
      </form>
    </AdminModal>
  );
}
