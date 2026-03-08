'use client';

import { useState } from 'react';
import { Project, CreateProjectData, UpdateProjectData } from '@/types/projects';
import { Loader2, X } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import dynamic from 'next/dynamic';

// Import design system components
import { useAdminAuth } from '@/hooks/useAdminAuth';
import ProjectCardSkeleton from '@/components/admin/ProjectCardSkeleton';

// New Modular Hooks & Components
import { useAdminProjects } from '../hooks/useAdminProjects';
import { useGitHubSync } from '../hooks/useGitHubSync';
import { ProjectToolbar } from './components/ProjectToolbar';
import { ProjectCard } from './components/ProjectCard';
import { Pagination } from './components/Pagination';

// Lazy load heavy modals
const ProjectForm = dynamic(() => import('@/components/admin/project-form/ProjectForm'), {
  loading: () => <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>
});
const SettingsModal = dynamic(() => import('@/app/admin/components/SettingsModal'), {
  loading: () => <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>
});
const ManageCommentsModal = dynamic(() => import('../components/ManageCommentsModal'));
const SecuritySettingsModal = dynamic(() => import('../components/SecuritySettingsModal'));

function SortableProjectItem({ id, children }: { id: string, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="h-full">
      {children}
    </div>
  );
}

export default function AdminProjectsClient() {
  useAdminAuth();

  // Custom Hooks
  const {
    orderedProjects,
    isLoading,
    error,
    commentCounts,
    createMutation,
    updateMutation,
    deleteMutation,
    handleReorder,
    handleBulkUpdate,
    isBulkUpdating,
    selectedProjectIds,
    toggleProjectSelection,
    selectAllProjects,
  } = useAdminProjects();

  const {
    githubConfig,
    connectionStatus,
    triggerSync
  } = useFirebaseStatus();

  // Local UI State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [managingCommentsProject, setManagingCommentsProject] = useState<Project | null>(null);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 18;

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Derived Paginated Data
  const totalPages = Math.ceil(orderedProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = orderedProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Actions Wrappers (Firebase is real-time, triggerSync is now a no-op but kept for compatibility)
  const handleToggleProjectStatus = (project: Project) => {
    const nextStatus = project.status === 'published' ? 'draft' : 'published';
    updateMutation.mutate({ ...project, status: nextStatus, id: project.id });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = orderedProjects.findIndex((i) => i.id === active.id);
      const newIndex = orderedProjects.findIndex((i) => i.id === over?.id);
      const newItems = [...orderedProjects];
      const [movedItem] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, movedItem);
      handleReorder(newItems);
    }
  };

  return (
    <div className="space-y-8">
      <ProjectToolbar
        connectionStatus={connectionStatus}
        selectedProjectIds={selectedProjectIds}
        isBulkUpdating={isBulkUpdating}
        allProjectsLength={orderedProjects.length}
        handleBulkUpdate={handleBulkUpdate}
        selectAllProjects={() => selectAllProjects(orderedProjects.map(p => p.id))}
        setShowSecurityModal={setShowSecurityModal}
        setShowSettings={setShowSettings}
        setShowCreateForm={setShowCreateForm}
      />

      <>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <X className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-700">Failed to load projects</p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <ProjectCardSkeleton key={i} />)}
          </div>
        ) : orderedProjects.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-lg mb-2">Project tidak ditemukan</p>
            <p className="text-gray-400 text-sm">Buat project pertama Anda untuk memulai</p>
          </div>
        ) : (
          <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={paginatedProjects.map(p => p.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedProjects.map((project) => (
                    <SortableProjectItem key={project.id} id={project.id}>
                      <ProjectCard
                        project={project}
                        selectedProjectIds={selectedProjectIds}
                        toggleProjectSelection={toggleProjectSelection}
                        handleToggleProjectStatus={handleToggleProjectStatus}
                        setEditingProject={setEditingProject}
                        handleDeleteProject={(id) => {
                          if (confirm('Hapus proyek ini?')) deleteMutation.mutate(id, { onSuccess: () => triggerGithubSync(true) });
                        }}
                        handleDuplicateProject={(p) => {
                          if (confirm(`Duplikat "${p.title}"?`)) {
                            createMutation.mutate({ ...p, title: `${p.title} (Copy)`, status: 'draft' } as CreateProjectData, {
                              onSuccess: () => triggerGithubSync(true)
                            });
                          }
                        }}
                        setManagingCommentsProject={setManagingCommentsProject}
                        commentCount={commentCounts[project.slug] || 0}
                      />
                    </SortableProjectItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </>

      {/* Modals */}
      {(showCreateForm || editingProject) && (
        <ProjectForm
          project={editingProject || undefined}
          allProjects={orderedProjects}
          title={editingProject ? 'Edit Proyek' : 'Buat Proyek Baru'}
          onCancel={() => { setShowCreateForm(false); setEditingProject(null); }}
          onSubmit={async (data) => {
            if (editingProject) {
              await updateMutation.mutateAsync(data as UpdateProjectData);
              setEditingProject(null);
            } else {
              await createMutation.mutateAsync(data as CreateProjectData);
              setShowCreateForm(false);
            }
          }}
        />
      )}

      {showSettings && (
        <SettingsModal
          initialConfig={githubConfig}
          onSave={saveGithubSettings}
          onCancel={() => setShowSettings(false)}
        />
      )}

      {managingCommentsProject && (
        <ManageCommentsModal
          project={managingCommentsProject}
          onClose={() => setManagingCommentsProject(null)}
        />
      )}

      {showSecurityModal && (
        <SecuritySettingsModal
          onClose={() => setShowSecurityModal(false)}
        />
      )}
    </div>
  );
}
