'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Project, CreateProjectData, UpdateProjectData } from '@/types/projects';
import { isVideoLink } from '@/lib/media';
import { Pencil, Trash2, Plus, Search, X, Loader2, Settings, CheckCircle2, AlertCircle, Copy, Eye, EyeOff, MessageCircle, Shield } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyCommented, setShowOnlyCommented] = useState(false);
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
    if (!githubConfig) {
      if (!skipConfirm) showError('Please configure GitHub settings first (click the gear icon).');
      setShowSettings(true);
      return;
    }

    if (!skipConfirm && !confirm('Save all changes to GitHub? This will trigger a deploy.')) return;

    setIsSavingToGithub(true);
    // If multiple syncs happen, we might want a generalized message or status?
    // For now 'pushing' is fine.
    setDeployStatus('pushing');
    setDeployProgress(10);

    try {
      // --- 1. Sync Projects (if provided or if checking projects tab) ---
      // We default to syncing projects if no specific galleryIds are provided, OR if projectsDataToSync IS provided.
      // Actually, let's keep it robust:
      // If galleryIds provided -> Sync Gallery
      // If projectsDataToSync provided -> Sync Projects
      // If neither -> Sync Projects (fallback default behavior)

      const tasks: Promise<any>[] = [];

      // Task A: Projects
      if (projectsDataToSync || !galleryIds) { // Default to provided projects logic
        const dataToUse = projectsDataToSync || projects;
        tasks.push((async () => {
          const filePath = 'src/data/projects.json';
          const fileContent = JSON.stringify({
            projects: dataToUse,
            lastUpdated: new Date().toISOString()
          }, null, 2);
          return performGithubUpdate(filePath, fileContent, 'Update projects via CMS');
        })());
      }

      // Task B: Gallery
      if (galleryIds) {
        tasks.push((async () => {
          const filePath = 'src/data/gallery-featured.json';
          const fileContent = JSON.stringify({
            featuredProjectIds: galleryIds,
            lastUpdated: new Date().toISOString()
          }, null, 2);
          return performGithubUpdate(filePath, fileContent, 'Update featured gallery via CMS');
        })());
      }

      await Promise.all(tasks);

      setDeployStatus('synced');
      success('Synced to GitHub');

      queryClient.invalidateQueries({ queryKey: ['projects', 'published'] });

      setTimeout(() => {
        setDeployStatus('idle');
        setIsSavingToGithub(false);
      }, 1500);

    } catch (e: any) {
      console.error(e);
      showError(e.message || 'Sync failed');
      setDeployStatus('failed');
      setTimeout(() => {
        setDeployStatus('idle');
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


  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase());
      const hasComments = (commentCounts[project.slug] || 0) > 0;
      const matchesCommentFilter = showOnlyCommented ? hasComments : true;
      return matchesSearch && matchesCommentFilter;
    });


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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          {/* ... existing header content ... */}
          <div className="flex items-center gap-2">
            {isSavingToGithub ? (
              deployStatus === 'synced' ? (
                <div className="flex items-center text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-200 font-medium">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Synced to GitHub
                </div>
              ) : deployStatus === 'failed' ? (
                <div className="flex items-center text-sm text-red-700 bg-red-100 px-3 py-1 rounded-full border border-red-200 font-medium">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Sync failed
                </div>
              ) : (
                <div className="flex items-center text-sm text-violet-600 bg-violet-50 px-3 py-1 rounded-full border border-violet-100">
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Processing...
                </div>
              )
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
              onClick={() => setShowOnlyCommented(!showOnlyCommented)}
              className={`inline-flex items-center justify-center px-3 py-2 border text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${showOnlyCommented
                ? 'bg-green-50 text-green-700 border-green-200 ring-green-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 ring-violet-500'
                }`}
              title={showOnlyCommented ? "Show All Projects" : "Show Commented Only"}
            >
              <MessageCircle className={`h-5 w-5 ${showOnlyCommented ? 'fill-green-500 text-green-600' : ''}`} />
            </button>

            <button
              onClick={() => setShowSecurityModal(true)}
              className="inline-flex items-center justify-center px-3 py-2 border text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors bg-white text-gray-700 border-gray-300 hover:bg-gray-50 ring-violet-500"
              title="Moderation Settings"
            >
              <Shield className="h-5 w-5" />
            </button>

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
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 text-lg mb-2">No projects found</p>
              <p className="text-gray-400 text-sm">Create your first project to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => {
                const isPublished = project.status === 'published';
                return (
                  <div key={project.id} className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden">
                    <div className="relative aspect-video bg-gray-100 overflow-hidden">
                      {isVideoLink(project.cover) ? (
                        <video src={project.cover} className="w-full h-full object-cover" muted loop playsInline preload="metadata" />
                      ) : (
                        <Image src={project.cover || FALLBACK_IMAGE} alt={project.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" loading="lazy" />
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1 gap-2">
                          <h3 className="text-lg font-bold text-gray-900 line-clamp-1 flex-1" title={project.title}>{project.title}</h3>
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
          onSubmit={async (data) => handleCreateProject(data)}
          onCancel={() => setShowCreateForm(false)}
          title="Create New Project"
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
