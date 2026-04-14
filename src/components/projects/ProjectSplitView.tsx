'use client'

import type { Project } from '@/types/projects'
import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion'
import { Heart, Eye, X, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import Media from '@/components/shared/Media'
import { resolveCover } from '@/lib/images'

interface ProjectSplitViewProps {
  projects: Project[]
  tag?: string
}

// Shared LazyMotion features — loaded once, not per-item
const sharedFeatures = domAnimation

// Memoized List Item — each item no longer wraps its own LazyMotion provider
const ProjectListItem = memo(function ProjectListItem({
  project,
  isActive,
  onSelect,
  index
}: {
  project: Project
  isActive: boolean
  onSelect: (project: Project) => void
  index: number
}) {
  return (
    <m.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.6) }}
      onClick={() => onSelect(project)}
      className={`group flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
        isActive ? 'bg-gray-100 ring-1 ring-gray-200' : 'hover:bg-gray-50'
      }`}
    >
      {/* Thumbnail - 4:5 Aspect Ratio */}
      <div className="relative w-14 aspect-[4/5] rounded overflow-hidden flex-shrink-0 bg-gray-200">
        {project.cover ? (() => {
          const cover = resolveCover(project);
          return (
            <Media
              kind={cover.kind}
              src={cover.src}
              poster={cover.poster}
              alt={project.title}
              className="w-full h-full object-cover"
              priority={cover.kind === 'image' ? index < 8 : false}
              posterPriority={cover.kind === 'video' ? index < 8 : undefined}
              autoplay={cover.kind === 'video' ? (project.autoplay ?? true) : undefined}
              muted={cover.kind === 'video' ? (project.muted ?? true) : undefined}
              loop={cover.kind === 'video' ? (project.loop ?? true) : undefined}
              playsInline={cover.kind === 'video' ? (project.playsInline ?? true) : undefined}
              lazy={index >= 8}
            />
          );
        })() : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={`text-sm truncate ${isActive ? 'font-semibold' : ''}`}>{project.title}</h3>
          <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-[8px] font-bold rounded uppercase tracking-wide flex-shrink-0">
            {project.type}
          </span>
        </div>
        <p className="text-xs text-gray-500 truncate">{project.client}</p>
        {project.likes ? (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-600">♥ {project.likes}</span>
          </div>
        ) : null}
      </div>
    </m.div>
  )
})

// Memoized Preview Panel — no redundant LazyMotion wrapper
const ProjectPreviewPanel = memo(function ProjectPreviewPanel({ project }: { project: Project }) {
  const cover = resolveCover(project);

  return (
    <m.div
      key={project.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
    >
      {/* Media - Max height 50vh */}
      <div className="relative max-h-[50vh] bg-gray-100 flex items-center justify-center">
        {cover.kind === 'video' ? (
          <video
            src={cover.src}
            className="max-h-[50vh] w-auto object-contain"
            autoPlay muted loop playsInline controls
          />
        ) : cover.src ? (
          <Image
            src={cover.src}
            alt={project.title}
            width={800}
            height={600}
            className="max-h-[50vh] w-auto object-contain"
            priority
            loading="eager"
            fetchPriority="high"
            unoptimized={cover.src.startsWith('http')}
          />
        ) : (
          <div className="h-[380px] flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-gray-300" />
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h2 className="text-base font-bold">{project.title}</h2>
          <span className="px-2 py-0.5 bg-gray-800 text-white text-[10px] rounded-full uppercase flex-shrink-0">
            {project.type}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-1.5">{project.client}</p>
        <p className="text-xs text-gray-600 line-clamp-3 mb-2">{project.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            {project.likes ? <span className="flex items-center gap-1"><Heart className="w-4 h-4 text-red-500 fill-red-500" /> {project.likes}</span> : null}
            {project.shares ? <span className="flex items-center gap-1"><Eye className="w-4 h-4 text-gray-400" /> {project.shares}</span> : null}
          </div>
          <a
            href={`/projects/${project.slug}`}
            className="flex items-center gap-1.5 text-blue-600 text-xs font-medium hover:text-blue-700 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View Details
          </a>
        </div>
      </div>
    </m.div>
  )
})

// Mobile Modal Component
function MobilePreviewModal({ isOpen, onClose, project }: {
  isOpen: boolean
  onClose: () => void
  project: Project | null
}) {
  if (!project) return null
  const cover = resolveCover(project);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 z-50 lg:hidden" />
          <m.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed inset-x-0 bottom-0 top-[10%] bg-white rounded-t-2xl z-50 lg:hidden overflow-auto"
          >
            <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-white rounded-full shadow">
              <X className="w-5 h-5" />
            </button>

            {/* Media */}
            <div className="relative bg-gray-100">
              {cover.kind === 'video' ? (
                <video src={cover.src} className="w-full max-h-[50vh] object-contain" autoPlay muted loop playsInline controls />
              ) : cover.src ? (
                <Image
                  src={cover.src}
                  alt={project.title}
                  width={800}
                  height={600}
                  className="w-full max-h-[50vh] object-contain"
                  loading="eager"
                  fetchPriority="high"
                  unoptimized={cover.src.startsWith('http')}
                />
              ) : null}
            </div>

            {/* Info */}
            <div className="p-4">
              <h2 className="text-xl font-bold mb-1">{project.title}</h2>
              <p className="text-gray-500 mb-2">{project.client}</p>
              <p className="text-gray-600 mb-4">{project.description}</p>
              <a href={`/projects/${project.slug}`} className="flex items-center justify-center gap-2 w-full py-3 text-blue-600 font-medium hover:text-blue-700 transition-colors">
                <Eye className="w-4 h-4" />
                View Details
              </a>
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function ProjectSplitView({ projects, tag: _tag }: ProjectSplitViewProps) {
  const [activeProject, setActiveProject] = useState<Project | null>(projects[0] || null)
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const projectsRef = useRef(projects)
  const activeProjectRef = useRef(activeProject)

  // Keep refs in sync
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  useEffect(() => {
    activeProjectRef.current = activeProject;
  }, [activeProject]);

  // Debounced resize handler
  useEffect(() => {
    const checkMobile = () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current)
      resizeTimeoutRef.current = setTimeout(() => {
        setIsMobile(window.innerWidth < 1024)
      }, 100)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => {
      window.removeEventListener('resize', checkMobile)
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current)
    }
  }, [])

  // Sync activeProject when projects array changes
  useEffect(() => {
    if (projects.length === 0) return
    const current = activeProjectRef.current
    const exists = current && projects.some(p => p.id === current.id)
    if (!exists) {
      setTimeout(() => {
        setActiveProject(projects[0])
      }, 0)
    }
  }, [projects])

  const handleProjectClick = useCallback((project: Project) => {
    setActiveProject(project)
    if (isMobile) setIsMobilePreviewOpen(true)
  }, [isMobile])

  // Keyboard navigation — stable via refs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const current = activeProjectRef.current
      const list = projectsRef.current
      if (!current) return

      const idx = list.findIndex(p => p.id === current.id)
      if (idx === -1) return

      if (e.key === 'ArrowDown' && idx < list.length - 1) {
        e.preventDefault()
        setActiveProject(list[idx + 1])
      } else if (e.key === 'ArrowUp' && idx > 0) {
        e.preventDefault()
        setActiveProject(list[idx - 1])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (projects.length === 0) {
    return <div className="p-12 text-center"><p className="text-gray-500">No projects found</p></div>
  }

  return (
    <LazyMotion features={sharedFeatures}>
      <div className="flex justify-center gap-2 h-[calc(100vh-240px)]">
        {/* Left Panel - List */}
        <div
          className="w-[55%] overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 overscroll-contain"
          onWheel={(e) => e.stopPropagation()}
          role="listbox"
          aria-label="Project list"
          aria-activedescendant={activeProject?.id || undefined}
        >
          <div className="space-y-1">
            {projects.map((project, index) => (
              <div key={project.id} id={project.id}>
                <ProjectListItem
                  project={project}
                  isActive={activeProject?.id === project.id}
                  onSelect={handleProjectClick}
                  index={index}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Preview */}
        {!isMobile && activeProject && (
          <div className="w-[40%] max-w-[420px] h-full overflow-y-auto scrollbar-hide overscroll-contain">
            <ProjectPreviewPanel project={activeProject} />
          </div>
        )}

        {/* Mobile Modal */}
        {isMobile && (
          <MobilePreviewModal
            isOpen={isMobilePreviewOpen}
            onClose={() => setIsMobilePreviewOpen(false)}
            project={activeProject}
          />
        )}
      </div>
    </LazyMotion>
  )
}
