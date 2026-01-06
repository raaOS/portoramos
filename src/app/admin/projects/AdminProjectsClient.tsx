'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Project, CreateProjectData, UpdateProjectData } from '@/types/projects';
import { isVideoLink } from '@/lib/media';
import { Pencil, Trash2, Plus, X, Loader2, Settings, CheckCircle2, AlertCircle, Copy, Eye, EyeOff, MessageCircle, Shield } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Import design system components
import dynamic from 'next/dynamic';
import AdminButton from '../components/AdminButton';
import StatusToggle from '../components/StatusToggle';
import { useToast } from '@/contexts/ToastContext';
import ProjectCardSkeleton from '@/components/admin/ProjectCardSkeleton';

// Lazy load heavy modals
const ProjectForm = dynamic(() => import('@/components/admin/project-form/ProjectForm'), {
  loading: () => <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>
});

const SettingsModal = dynamic(() => import('@/app/admin/components/SettingsModal'), {
  loading: () => <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>
});

const ManageCommentsModal = dynamic(() => import('../components/ManageCommentsModal'));

const SecuritySettingsModal = dynamic(() => import('../components/SecuritySettingsModal'));

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

const GalleryManager = dynamic(() => import('@/components/admin/GalleryManager'), { loading: () => <Loader2 className="animate-spin" /> });

export default function AdminProjectsClient() {
  const queryClient = useQueryClient();
  const { showSuccess: success, showError } = useToast();

  // Tab State
  const [activeTab, setActiveTab] = useState<'projects' | 'gallery'>('projects');

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [managingCommentsProject, setManagingCommentsProject] = useState<Project | null>(null);

  // showOnlyCommented removed
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [isSavingToGithub, setIsSavingToGithub] = useState(false);

  // GitHub Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [githubConfig, setGithubConfig] = useState<GitHubConfig | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error' | 'disconnected'>('disconnected');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Deployment Tracking State
  const [deployProgress, setDeployProgress] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<'idle' | 'pushing' | 'synced' | 'failed'>('idle');

  // Bulk Selection State
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // --- React Query Hooks ---

  // 1. Fetch Projects
  const { data: projectsData, isLoading: loadingProjects, error: projectsError } = useQuery({
    queryKey: ['projects', 'admin'],
    queryFn: async () => {
      // Always request FRESH data in admin panel to avoid stale cache issues (deleted items reappearing, etc)
      const res = await fetch('/api/projects?fresh=true');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    }
  });

  const projects = (projectsData?.projects || []) as Project[];

  // 2. Fetch Comment Counts
  const { data: commentCounts } = useQuery({
    queryKey: ['comments', 'counts'],
    queryFn: async () => {
      const res = await fetch('/api/comments');
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      const counts: Record<string, number> = {};
      if (data.comments) {
        Object.entries(data.comments).forEach(([slug, commentsList]: [string, any]) => {
          const total = Array.isArray(commentsList)
            ? commentsList.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)
            : 0;
          counts[slug] = total;
        });
      }
      return counts;
    },
    initialData: {}
  });

  // --- Mutations ---

  const verifyConnection = useCallback(async (config: GitHubConfig) => {
    // Validate config exists and has required fields
    if (!config || !config.owner || !config.repo || !config.token) {
      // Do not set error state if just missing, simply stay disconnected or idle
      return;
    }

    setConnectionStatus('checking');
    setConnectionError(null);
    try {
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
    } catch (e: any) {
      console.error(e);
      setConnectionStatus('error');
      // Handle actual fetch failures (network, CORS, etc)
      setConnectionError(e.message === 'Failed to fetch' ? 'Connection Failed (Network/CORS)' : 'Network Error');
    }
  }, []);

  // Load GitHub Config on Mount (Client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedConfig = localStorage.getItem('github_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setGithubConfig(parsed);
        verifyConnection(parsed);
      }
    }
  }, [verifyConnection]);

  const saveGithubSettings = (config: GitHubConfig) => {
    localStorage.setItem('github_config', JSON.stringify(config));
    setGithubConfig(config);
    setShowSettings(false);
    verifyConnection(config);
    success('GitHub settings saved!');
  };


  const triggerGithubSync = async (projectsDataToSync?: Project[], skipConfirm = false, galleryIds?: string[]) => {
    // If we have a connected status or just want to force sync
    if (!skipConfirm && !confirm('Save all changes to GitHub? This will trigger a deploy.')) return;

    setIsSavingToGithub(true);
    setDeployStatus('pushing');
    setDeployProgress(10);

    try {
      const res = await fetch('/api/admin/sync', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Msg failed');

      setDeployStatus('synced');
      success('Synced to GitHub & Triggered Vercel!');

      // Stop loading state
      setTimeout(() => {
        setIsSavingToGithub(false);
      }, 1500);

    } catch (e: any) {
      console.error(e);
      showError(e.message || 'Sync failed');
      setDeployStatus('failed');
      setTimeout(() => {
        setDeployStatus('idle'); // Reset failed status to allow retry
        setIsSavingToGithub(false);
      }, 2000);
    }
  };

  const performGithubUpdate = async (filePath: string, newContent: string, commitMessage: string) => {
    if (!githubConfig) throw new Error('No config');

    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const getUrl = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${filePath}`;
        // Force bypass cache to avoid 409
        const getRes = await fetch(getUrl, {
          headers: {
            'Authorization': `Bearer ${githubConfig.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
          cache: 'no-store'
        });

        // It's okay if file doesn't exist for create, but for update it usually should. 
        // If 404, we create.
        let sha;
        if (getRes.ok) {
          const fileData = await getRes.json();
          sha = fileData.sha;
        }

        const encodedContent = utf8_to_b64(newContent);

        const putRes = await fetch(getUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${githubConfig.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: commitMessage,
            content: encodedContent,
            sha: sha
          })
        });

        if (!putRes.ok) throw new Error(`GitHub Update Failed: ${putRes.statusText}`);
        return; // Success

      } catch (err: any) {
        console.warn(`Attempt ${attempt} failed for ${filePath}:`, err.message);
        lastError = err;
        if (attempt < 3) await new Promise(r => setTimeout(r, 1000));
      }
    }
    throw lastError;
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: CreateProjectData | UpdateProjectData) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create project');
      }
      return response.json();
    },
    onSuccess: (newItem) => {
      queryClient.setQueryData(['projects', 'admin'], (old: any) => ({
        ...old,
        projects: [...(old?.projects || []), newItem.project]
      }));
      queryClient.invalidateQueries({ queryKey: ['projects', 'published'] }); // Immediate sync for local
      success('Project created');
      setShowCreateForm(false);
      // Determine what to sync
      const freshData = queryClient.getQueryData(['projects', 'admin']) as any;
      if (freshData?.projects) triggerGithubSync(freshData.projects, true);
    },
    onError: (err: any) => showError(err.message || 'Failed to create project')
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateProjectData) => {
      const response = await fetch(`/api/projects/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update project');
      }
      return response.json();
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['projects', 'admin'] });
      const previousProjects = queryClient.getQueryData(['projects', 'admin']);

      queryClient.setQueryData(['projects', 'admin'], (old: any) => ({
        ...old,
        projects: old.projects.map((p: Project) =>
          p.id === newData.id ? { ...p, ...newData } : p
        )
      }));

      return { previousProjects };
    },
    onError: (err: any, newData, context) => {
      queryClient.setQueryData(['projects', 'admin'], context?.previousProjects);
      showError(err.message || 'Failed to update project');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'admin'] });
    },
    onSuccess: (data, variables) => {
      setEditingProject(null);
      queryClient.invalidateQueries({ queryKey: ['projects', 'published'] }); // Immediate sync for local
      const freshData = queryClient.getQueryData(['projects', 'admin']) as any;
      if (freshData?.projects) triggerGithubSync(freshData.projects, true);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete project');
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData(['projects', 'admin'], (old: any) => ({
        ...old,
        projects: old.projects.filter((p: Project) => p.id !== id)
      }));
      queryClient.invalidateQueries({ queryKey: ['projects', 'published'] }); // Immediate sync for local
      success('Project deleted');
      const freshData = queryClient.getQueryData(['projects', 'admin']) as any;
      if (freshData?.projects) triggerGithubSync(freshData.projects, true);
    },
    onError: (err: any) => showError(err.message || 'Failed to delete project')
  });

  const handleCreateProject = (data: CreateProjectData | UpdateProjectData) => {
    createMutation.mutate(data);
  };

  const handleUpdateProject = (data: CreateProjectData | UpdateProjectData) => updateMutation.mutate(data as UpdateProjectData);
  const handleDeleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) deleteMutation.mutate(id);
  }

  const handleToggleProjectStatus = (project: Project) => {
    const nextStatus = project.status === 'published' ? 'draft' : 'published';
    updateMutation.mutate({ ...project, status: nextStatus, id: project.id });
  };

  const handleDuplicateProject = (project: Project) => {
    if (!confirm(`Duplicate project "${project.title}"?`)) return;
    const duplicateData = {
      ...project,
      title: `${project.title} (Copy)`,
      status: 'draft',
    } as CreateProjectData;

    createMutation.mutate(duplicateData);
  };

  const toggleProjectSelection = (id: string) => {
    const newSelected = new Set(selectedProjectIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProjectIds(newSelected);
  };

  const selectAllProjects = () => {
    if (selectedProjectIds.size === projects.length) {
      setSelectedProjectIds(new Set());
    } else {
      setSelectedProjectIds(new Set(projects.map(p => p.id)));
    }
  };

  const handleBulkUpdate = async (action: 'publish' | 'draft' | 'delete') => {
    if (selectedProjectIds.size === 0) return;
    if (!confirm(`Are you sure you want to ${action} ${selectedProjectIds.size} projects?`)) return;

    setIsBulkUpdating(true);
    try {
      // 1. Perform atomic bulk update via optimized API
      const res = await fetch('/api/projects/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ids: Array.from(selectedProjectIds)
        })
      });

      if (!res.ok) {
        throw new Error('Bulk update API failed');
      }

      // 2. Clear selection
      setSelectedProjectIds(new Set());
      success(`Bulk ${action} complete`);

      // 3. Invalidate queries to refresh UI
      await queryClient.invalidateQueries({ queryKey: ['projects', 'admin'] });

      // 3. Invalidate queries to refresh UI
      await queryClient.invalidateQueries({ queryKey: ['projects', 'admin'] });

      // No need to trigger manual sync, /api/projects/bulk already updates GitHub directly.

    } catch (e) {
      console.error(e);
      showError('Bulk action failed');
    } finally {
      setIsBulkUpdating(false);
    }
  };




  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('projects')}
            className={`${activeTab === 'projects'
              ? 'border-violet-500 text-violet-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`${activeTab === 'gallery'
              ? 'border-violet-500 text-violet-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            About Gallery
          </button>
        </nav>
      </div>

      {/* Header Actions - Only Show in Projects Tab */}
      {activeTab === 'projects' && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
          {/* Status Indicators */}
          <div className="flex-shrink-0 flex items-center">
            {isSavingToGithub ? (
              deployStatus === 'synced' ? (
                <div className="h-10 px-4 flex items-center text-sm text-green-600 bg-white rounded-lg border border-green-200 font-medium whitespace-nowrap select-none shadow-sm">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Synced
                </div>
              ) : deployStatus === 'failed' ? (
                <div className="h-10 px-4 flex items-center text-sm text-red-600 bg-white rounded-lg border border-red-200 font-medium whitespace-nowrap select-none">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Sync Failed
                </div>
              ) : (
                <div className="h-10 px-4 flex items-center text-sm text-violet-600 bg-white rounded-lg border border-violet-200 whitespace-nowrap select-none">
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Processing...
                </div>
              )
            ) : (
              <>
                {connectionStatus === 'connected' ? (
                  deployStatus === 'synced' ? (
                    <div className="h-10 px-4 flex items-center text-sm text-green-700 bg-white rounded-lg border border-green-200 whitespace-nowrap select-none font-medium">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                      Deployed to GitHub
                    </div>
                  ) : (
                    <div className="h-10 px-4 flex items-center text-sm text-green-600 bg-white rounded-lg border border-green-200 whitespace-nowrap select-none">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      GitHub Connected
                    </div>
                  )
                ) : null}
                {connectionStatus === 'checking' && (
                  <div className="h-10 px-4 flex items-center text-sm text-yellow-600 bg-white rounded-lg border border-yellow-200 whitespace-nowrap select-none">
                    <Loader2 className="animate-spin w-3 h-3 mr-2" />
                    Checking...
                  </div>
                )}
                {connectionStatus === 'error' && (
                  <div className="h-10 px-4 flex items-center text-sm text-red-600 bg-white rounded-lg border border-red-200 whitespace-nowrap select-none">
                    <AlertCircle className="w-3 h-3 mr-2" />
                    GitHub Error
                  </div>
                )}
              </>
            )}
          </div>

          {/* Main Toolbar */}
          <div className="flex-1 flex flex-col sm:flex-row gap-3 min-w-0">
            {/* Bulk Actions Toolbar */}
            {selectedProjectIds.size > 0 ? (
              <div className="flex-1 h-10 flex items-center gap-2 bg-white px-4 rounded-lg border border-violet-200 animate-in fade-in slide-in-from-top-1 overflow-hidden select-none">
                <span className="text-sm font-bold text-violet-600 whitespace-nowrap mr-2">
                  {selectedProjectIds.size} Selected
                </span>
                <div className="h-4 w-px bg-violet-100 mx-1 flex-shrink-0" />

                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => handleBulkUpdate('publish')}
                    disabled={isBulkUpdating}
                    className="flex items-center px-3 py-1 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    Publish
                  </button>
                  <button
                    onClick={() => handleBulkUpdate('draft')}
                    disabled={isBulkUpdating}
                    className="flex items-center px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors whitespace-nowrap"
                  >
                    <EyeOff className="w-4 h-4 mr-1.5" />
                    Draft
                  </button>
                  <button
                    onClick={() => handleBulkUpdate('delete')}
                    disabled={isBulkUpdating}
                    className="flex items-center px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors whitespace-nowrap"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Delete
                  </button>
                </div>

                {isBulkUpdating && <Loader2 className="w-4 h-4 animate-spin text-violet-600 ml-auto" />}
              </div>
            ) : (
              <div className="flex-1"></div>
            )}

            {/* Action Buttons Group */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={selectAllProjects}
                className={`h-10 w-10 inline-flex items-center justify-center border rounded-lg focus:outline-none transition-all flex-shrink-0 ${selectedProjectIds.size > 0 && selectedProjectIds.size === projects.length
                  ? 'bg-violet-600 border-violet-600 text-white' // Active: Solid
                  : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600' // Inactive: Clean outline, no shadow
                  }`}
                title="Select All"
              >
                <CheckCircle2 className={`h-5 w-5 ${selectedProjectIds.size > 0 && selectedProjectIds.size === projects.length ? 'text-white' : ''}`} />
              </button>

              <button
                onClick={() => setShowSecurityModal(true)}
                className="h-10 w-10 inline-flex items-center justify-center border text-sm font-medium rounded-lg focus:outline-none transition-all bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600 flex-shrink-0"
                title="Moderation Settings"
              >
                <Shield className="h-5 w-5" />
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className={`h-10 w-10 inline-flex items-center justify-center border text-sm font-medium rounded-lg focus:outline-none transition-all flex-shrink-0 ${!githubConfig || connectionStatus === 'error' ? 'bg-white text-amber-500 border-amber-200 hover:border-amber-300' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
                  }`}
                title="GitHub Settings"
              >
                <Settings className={`h-5 w-5 ${(!githubConfig || connectionStatus === 'error') ? 'animate-pulse' : ''}`} />
              </button>

              <button
                onClick={() => setShowCreateForm(true)}
                className="h-10 inline-flex items-center justify-center px-6 border border-transparent text-sm font-bold rounded-lg text-white bg-violet-600 hover:bg-violet-700 focus:outline-none transition-all flex-shrink-0 whitespace-nowrap"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Add Project
              </button>
            </div>
          </div>
        </div>
      )}


      {activeTab === 'projects' ? (
        <>
          {projectsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <X className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-700">Failed to load projects</p>
            </div>
          )}

          {loadingProjects ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 text-lg mb-2">No projects found</p>
              <p className="text-gray-400 text-sm">Create your first project to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const isPublished = project.status === 'published';
                return (
                  <div key={project.id} className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden">
                    <div className="relative aspect-video bg-gray-100 overflow-hidden">
                      {/* Selection Checkbox Overlay */}
                      <div className={`absolute top-2 left-2 z-10 transition-opacity duration-200 ${selectedProjectIds.has(project.id) || 'group-hover:opacity-100 opacity-0'}`}>
                        <input
                          type="checkbox"
                          checked={selectedProjectIds.has(project.id)}
                          onChange={() => toggleProjectSelection(project.id)}
                          className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer shadow-sm"
                        />
                      </div>

                      {isVideoLink(project.cover) ? (
                        <video src={project.cover} className="w-full h-full object-cover" muted loop playsInline preload="metadata" />
                      ) : (
                        <Image src={project.cover || FALLBACK_IMAGE} alt={project.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" loading="lazy" />
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1 gap-2">
                          <h3 className="text-lg font-bold text-gray-900 line-clamp-1 flex-1 cursor-pointer hover:text-violet-600" title={project.title} onClick={() => toggleProjectSelection(project.id)}>
                            {project.title}
                          </h3>
                          <StatusToggle
                            isActive={isPublished}
                            onClick={() => handleToggleProjectStatus(project)}
                            className="flex-shrink-0"
                            iconActive={<Eye className="w-4 h-4" />}
                            iconInactive={<EyeOff className="w-4 h-4" />}
                            labelActive=""
                            labelInactive=""
                          />
                        </div>
                        <p className="text-sm text-violet-600 font-medium mb-2">{project.client} • {project.year}</p>
                        <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
                      </div>
                      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setManagingCommentsProject(project)}
                            className={`inline-flex items-center justify-center px-3 py-2 rounded-lg transition-colors gap-1.5 ${(commentCounts[project.slug] || 0) > 0
                              ? 'text-green-600 bg-green-50 hover:bg-green-100'
                              : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                              }`}
                            title="Manage Comments"
                          >
                            <MessageCircle className="w-4 h-4" />
                            {(commentCounts[project.slug] || 0) > 0 && (
                              <span className="text-xs font-bold">{commentCounts[project.slug]}</span>
                            )}
                          </button>
                          <button onClick={() => setEditingProject(project)} className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-violet-600 hover:bg-violet-50 transition-colors" title="Edit Project">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDuplicateProject(project)} className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Duplicate Project">
                            <Copy className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteProject(project.id)} className="inline-flex items-center justify-center p-2 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors ml-1" title="Delete Project">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <GalleryManager
          projects={projects}
          onSyncTrigger={(projectsData, skipConfirm, galleryIds) => triggerGithubSync(projectsData, skipConfirm, galleryIds)}
        />
      )}

      {showSettings && (
        <SettingsModal
          initialConfig={githubConfig}
          onSave={saveGithubSettings}
          onCancel={() => setShowSettings(false)}
        />
      )}

      {showCreateForm && (
        <ProjectForm
          title="Create New Project"
          allProjects={projectsData?.projects || []}
          onSubmit={async (data) => {
            createMutation.mutate(data);
            setShowCreateForm(false);
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingProject && (
        <ProjectForm
          project={editingProject}
          onSubmit={async (data) => handleUpdateProject(data)}
          onCancel={() => setEditingProject(null)}
          title="Edit Project"
        />
      )}

      {managingCommentsProject && (
        <ManageCommentsModal
          project={managingCommentsProject}
          onClose={() => setManagingCommentsProject(null)}
          onSyncTrigger={() => triggerGithubSync(undefined, true)}
        />
      )}

      {showSecurityModal && (
        <SecuritySettingsModal onClose={() => setShowSecurityModal(false)} />
      )}
    </div>
  );
}
