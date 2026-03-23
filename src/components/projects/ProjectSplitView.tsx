'use client'

import type { Project } from '@/types/projects'
import { useState, useEffect, useCallback } from 'react'
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion'
import { Heart, Eye, X, Maximize2, Film, Image as ImageIcon } from 'lucide-react'
import Media from '@/components/shared/Media'

interface ProjectSplitViewProps {
  projects: Project[]
  tag?: string
}

export default function ProjectSplitView({ projects, tag }: ProjectSplitViewProps) {
  const [activeProject, setActiveProject] = useState<Project | null>(projects[0] || null)
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Update activeProject ketika projects berubah (dengan proper guard)
  useEffect(() => {
    if (projects.length === 0) return;
    
    const exists = projects.some(p => p.id === activeProject?.id);
    if (!exists && activeProject?.id) {
      // Jika project sebelumnya tidak ada lagi di list, set ke yang pertama
      const frame = requestAnimationFrame(() => setActiveProject(projects[0]));
      return () => cancelAnimationFrame(frame);
    }
    // Jika activeProject masih null tapi projects sudah ada, set ke yang pertama
    if (!activeProject) {
      const frame = requestAnimationFrame(() => setActiveProject(projects[0]));
      return () => cancelAnimationFrame(frame);
    }
  }, [projects, activeProject?.id, activeProject]);

  const handleProjectClick = useCallback((project: Project) => {
    setActiveProject(project)
    if (isMobile) setIsMobilePreviewOpen(true)
  }, [isMobile])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeProject) return
      const currentIndex = projects.findIndex(p => p.id === activeProject.id)
      if (e.key === 'ArrowDown' && currentIndex < projects.length - 1) {
        e.preventDefault()
        setActiveProject(projects[currentIndex + 1])
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault()
        setActiveProject(projects[currentIndex - 1])
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeProject, projects])

  if (projects.length === 0) {
    return <div className="p-12 text-center"><p className="text-gray-500">No projects found</p></div>
  }

  return (
    <div className="flex justify-center gap-2 h-[calc(100vh-240px)]">
      {/* Left Panel - List - Fixed width 55% */}
      <div 
        className="w-[55%] overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 overscroll-contain"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          {projects.map((project, index) => (
            <ProjectListItem
              key={project.id}
              project={project}
              isActive={activeProject?.id === project.id}
              onClick={() => handleProjectClick(project)}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Right Panel - Preview - Independent Scroll */}
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
  )
}

// List Item
function ProjectListItem({ project, isActive, onClick, index }: {
  project: Project
  isActive: boolean
  onClick: () => void
  index: number
}) {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: index * 0.03 }}
        onClick={onClick}
        className={`group flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
          isActive ? 'bg-gray-100 ring-1 ring-gray-200' : 'hover:bg-gray-50'
        }`}
      >
        {/* Thumbnail - 4:5 Aspect Ratio (clean, no tag) */}
        <div className="relative w-14 aspect-[4/5] rounded overflow-hidden flex-shrink-0 bg-gray-200">
          {project.cover ? (
            <Media kind="image" src={project.cover} alt={project.title} className="w-full h-full object-cover" priority={index < 5} />
          ) : (
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
          <div className="flex items-center gap-2 mt-0.5">
            {project.likes ? <span className="text-xs text-gray-600">♥ {project.likes}</span> : null}
          </div>
        </div>
      </m.div>
    </LazyMotion>
  )
}

// Preview Panel
function ProjectPreviewPanel({ project }: { project: Project }) {
  const isVideo = project.cover?.match(/\.(mp4|mov|webm)$/i)
  
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
      >
        {/* Media - Max height 50vh untuk muat di viewport */}
        <div className="relative max-h-[50vh] bg-gray-100 flex items-center justify-center">
          {isVideo ? (
            <video
              src={project.cover}
              className="max-h-[50vh] w-auto object-contain"
              autoPlay muted loop playsInline controls
            />
          ) : project.cover ? (
            <img
              src={project.cover}
              alt={project.title}
              className="max-h-[50vh] w-auto object-contain"
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
    </LazyMotion>
  )
}

// Mobile Modal
function MobilePreviewModal({ isOpen, onClose, project }: {
  isOpen: boolean
  onClose: () => void
  project: Project | null
}) {
  if (!project) return null
  const isVideo = project.cover?.match(/\.(mp4|mov|webm)$/i)
  
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
              {isVideo ? (
                <video src={project.cover} className="w-full max-h-[50vh] object-contain" autoPlay muted loop playsInline controls />
              ) : project.cover ? (
                <img src={project.cover} alt={project.title} className="w-full max-h-[50vh] object-contain" />
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
