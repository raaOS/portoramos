'use client';

import React, { startTransition, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence, m, LazyMotion, domMax } from 'motion/react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useLayoutPersistence } from '../contexts/LayoutPersistenceContext';
import { useDesktopWindowContext } from '../context/DesktopWindowContext';
import { useStickyNotes } from '../hooks/useStickyNotes';
import { useDesktopLock } from '../hooks/useDesktopLock';
import { useBootSequence } from '../hooks/useBootSequence';
import { useDesktopShortcuts } from '../hooks/useDesktopShortcuts';
import { useChatContacts } from '../hooks/useChatContacts';
import { useDesktopLayout } from '../hooks/useDesktopLayout';
import { useDesktopIcons } from '../hooks/useDesktopIcons';
import { useDesktopNavigation } from '../hooks/useDesktopNavigation';
import { useOSSystem } from '../context/OSSystemContext';
import type { AboutData } from '@/types/about';
import type { ExperienceData } from '@/types/experience';
import type { HardSkillsData } from '@/types/hardSkill';
import type { Project } from '@/types/projects';
import type { TestimonialData } from '@/types/testimonial';
import type { ContactData } from '@/types/contact';
import { soundManager } from '../utils/SoundManager';
import { createInitialWindows } from '../utils/windowFactory';
import { clearVisitorPositions } from '../utils/positionSync';
import { Z_LAYERS } from '../utils/zIndexLayers';
import type { ContactProfile } from '../data/mockChats';
import DesktopProviders from './DesktopProviders';
import DesktopBackground from '../ui/DesktopBackground';
import DesktopSkeleton from '../ui/DesktopSkeleton';

const DesktopIconsLayer = dynamic(() => import('../layers/DesktopIconsLayer'), { ssr: false });
const UnifiedLayer = dynamic(() => import('../layers/UnifiedLayer'), { ssr: false });
const UIOverlaysLayer = dynamic(() => import('../layers/UIOverlaysLayer'), { ssr: false });
const ChatWindow = dynamic(() => import('../windows/ChatWindow'), {
  loading: () => <div className="h-full w-full animate-pulse rounded bg-gray-100" />,
  ssr: false,
});
const StartScreen = dynamic(() => import('../ui/StartScreen'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black" style={{ zIndex: Z_LAYERS.BOOT }} />,
});
const RetroMobileOverlay = dynamic(() => import('../ui/RetroMobileOverlay'), {
  loading: () => <div className="fixed inset-0 bg-[#c0c0c0]" style={{ zIndex: Z_LAYERS.CHROME }} />,
  ssr: false,
});

export interface DesktopEnvironmentProps {
  children?: React.ReactNode;
  aboutData?: AboutData | null;
  experienceData?: ExperienceData | null;
  hardSkillsData?: HardSkillsData | null;
  projects: Project[];
  testimonialsData?: TestimonialData | null;
  contactData?: ContactData | null;
}

interface DesktopMainBaseProps {
  aboutData?: AboutData | null;
  isMobile: boolean;
  isAdmin: boolean;
  csrfToken: string | null;
  commercialProjects: Project[];
  projects: Project[];
  dynamicContacts: Record<string, ContactProfile>;
  testimonialContacts: ContactProfile[];
  isAuthLoading: boolean;
}

interface DesktopMainWithLogoutProps extends DesktopMainBaseProps {
  originalLogout: () => Promise<void>;
}

interface DesktopMainProps extends DesktopMainBaseProps {
  logout: () => void | Promise<void>;
}

export default function DesktopEnvironment({
  aboutData,
  experienceData,
  hardSkillsData,
  projects,
  testimonialsData,
  contactData,
}: DesktopEnvironmentProps) {
  const { mounted, isMobile } = useDesktopLock();
  const { needsPowerOn, isBooting } = useBootSequence();
  const { isAdmin, csrfToken, logout: originalLogout, isLoading: isAuthLoading } = useAdminAuth();
  const { dynamicContacts, testimonialContacts } = useChatContacts(testimonialsData);

  const commercialProjects = useMemo(() => {
    const visibleIds = aboutData?.desktopPreferences?.visibleProjectIds;
    if (visibleIds && visibleIds.length > 0) {
      const filtered = projects.filter((p) => visibleIds.includes(p.id));
      if (filtered.length > 0) return filtered;
    }
    return projects;
  }, [projects, aboutData]);

  const initialWindows = useMemo(
    () =>
      createInitialWindows({
        aboutData,
        experienceData,
        hardSkillsData,
        contactData,
        projects,
        commercialProjects,
        dynamicContacts,
        isAdmin,
      }),
    [
      aboutData,
      experienceData,
      hardSkillsData,
      contactData,
      projects,
      commercialProjects,
      dynamicContacts,
      isAdmin,
    ]
  );

  if (!mounted) {
    return (
      <DesktopSkeleton
        isBooting={needsPowerOn || isBooting}
        wallpaperUrl={
          aboutData?.wallpaperConfig?.collection?.find(
            (w) => w.id === aboutData.wallpaperConfig?.activeWallpaperId
          )?.url
        }
      />
    );
  }

  return (
    <DesktopProviders
      initialWindows={initialWindows}
      aboutData={aboutData}
      csrfToken={csrfToken || undefined}
      isAdmin={isAdmin}
    >
      <DesktopMainWithLogout
        aboutData={aboutData}
        isMobile={isMobile}
        commercialProjects={commercialProjects}
        projects={projects}
        isAdmin={isAdmin}
        csrfToken={csrfToken ?? null}
        originalLogout={originalLogout}
        dynamicContacts={dynamicContacts}
        testimonialContacts={testimonialContacts}
        isAuthLoading={isAuthLoading}
      />
    </DesktopProviders>
  );
}

function DesktopMainWithLogout({ originalLogout, ...props }: DesktopMainWithLogoutProps) {
  const { flushAll } = useLayoutPersistence();
  const handleLogout = async () => {
    await flushAll();
    clearVisitorPositions();
    await new Promise((r) => setTimeout(r, 300));
    await originalLogout();
  };
  return <DesktopMain {...props} logout={handleLogout} />;
}

function DesktopMain({
  aboutData,
  isMobile,
  isAdmin,
  logout,
  csrfToken,
  commercialProjects,
  projects,
  dynamicContacts,
  testimonialContacts,
  isAuthLoading,
}: DesktopMainProps) {
  const { needsPowerOn, isBooting, finishBooting } = useBootSequence();
  const { startScreenReady, setStartScreenReady, isRevealed, setIsRevealed } = useOSSystem();
  const wasBootSkipped = !needsPowerOn && !isBooting;

  // Track which icons are currently "morphed" into windows (supports multiple)
  // Getter tidak dipakai karena status morph hanya dipakai oleh handlers,
  // tapi setter perlu untuk add/delete id.
  const [, setActiveIconIds] = React.useState<Set<string>>(new Set());

  useDesktopShortcuts();

  const handleGoHome = useCallback(() => {
    window.location.href = '/';
  }, []);

  const {
    openWindow,
    resetWindows,
    requestNextZIndex,
    windows,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updateWindowPosition,
    handleWindowResize,
    handleWindowResizeEnd,
    togglePin,
  } = useDesktopWindowContext();

  const {
    notes,
    addNote,
    updateNote,
    deleteNote,
    permanentDeleteNote,
    restoreNote,
    bringToFrontNote,
  } = useStickyNotes(true, isAdmin, csrfToken ?? undefined, requestNextZIndex, isAuthLoading);
  const {
    openProjectWindow: baseOpenProjectWindow,
    navToChat,
    openWhatsAppList,
    toggleNotesVisibility,
  } = useDesktopNavigation({
    openWindow,
    resetWindows,
    dynamicContacts,
    ChatWindow,
    _notes: notes,
    projects,
    _restoreNote: restoreNote,
    _addNote: addNote,
    _isAdmin: isAdmin,
    setNotesDockBouncing: () => {},
  });

  // Wrap openProjectWindow to also track which icons are morphing
  const openProjectWindow = useCallback(
    (project: Project, originRect?: { x: number; y: number; width: number; height: number }) => {
      setActiveIconIds((prev) => new Set([...prev, project.id]));
      baseOpenProjectWindow(project, originRect);
    },
    [baseOpenProjectWindow]
  );
  const { iconPositions, handleIconPositionChange } = useDesktopLayout({
    aboutData,
    isAdmin,
    csrfToken,
  });
  const { projectIcons } = useDesktopIcons({
    mounted: true,
    commercialProjects,
    aboutData,
    handleGoHome,
    onOpenExplorer: () => openWindow('explorer'),
    iconPositions,
  });

  const handleBootComplete = useCallback(() => {
    if (aboutData?.soundConfig) soundManager.loadConfig(aboutData.soundConfig);
    soundManager.suppressSound('window-open', 1500);
    soundManager.suppressSound('notification', 1000);
    startTransition(() => setIsRevealed(true));
    finishBooting();
  }, [aboutData, finishBooting, setIsRevealed]);

  const releaseBootCover = useCallback(() => {
    document.documentElement.removeAttribute('data-os-needs-boot');
  }, []);

  // Handle initial sound suppression if boot is skipped
  useEffect(() => {
    if (!needsPowerOn && !isBooting) {
      soundManager.suppressSound('window-open', 800);
      soundManager.suppressSound('notification', 800);
    }
  }, [needsPowerOn, isBooting]);

  // Synchronize OS states for skipped boot to ensure immediate visibility on refresh
  useEffect(() => {
    if (wasBootSkipped && (!isRevealed || !startScreenReady)) {
      startTransition(() => {
        setIsRevealed(true);
        setStartScreenReady(true);
      });
    }
  }, [wasBootSkipped, isRevealed, startScreenReady, setIsRevealed, setStartScreenReady]);

  const searchParams = useSearchParams();

  // URL PARAM FIX: Ref-based guard agar kombinasi `app` param hanya
  // di-handle sekali. Sebelumnya effect bisa re-fire saat context
  // mengupdate `openWindow` reference sementara `replaceState` belum
  // propagate → `openWindow(app)` terpanggil dua kali.
  const handledAppParamRef = React.useRef<string | null>(null);

  useEffect(() => {
    const rawApp = searchParams.get('app');
    if (!rawApp) {
      handledAppParamRef.current = null;
      return;
    }
    if (handledAppParamRef.current === rawApp) return;
    handledAppParamRef.current = rawApp;

    const app = rawApp === 'mail' ? 'contact' : rawApp;
    if (app === 'whatsapp') {
      openWhatsAppList();
    } else {
      openWindow(app);
    }

    // Cleanup URL setelah handled
    if (typeof window !== 'undefined') {
      const nextUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', nextUrl);
    }
  }, [searchParams, openWindow, openWhatsAppList]);

  const isDesktopReady = wasBootSkipped || startScreenReady;
  const isDesktopRevealed = wasBootSkipped || isRevealed;

  // Preload NonOSChrome dynamically so navigation to /projects is instant and dock doesn't slide
  useEffect(() => {
    if (isDesktopRevealed) {
      const preload = () => {
        import('@/components/layout/NonOSChrome').catch(() => {});
      };
      if (typeof window !== 'undefined') {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(preload);
        } else {
          setTimeout(preload, 1000);
        }
      }
    }
  }, [isDesktopRevealed]);

  return (
    <LazyMotion features={domMax}>
      {isMobile ? (
        <RetroMobileOverlay />
      ) : (
        <>
          {(needsPowerOn || isBooting) && (
            <AnimatePresence>
              <StartScreen
                key="start-screen"
                onStart={handleBootComplete}
                isActive={needsPowerOn || isBooting}
                onReady={() => {
                  // `body::before` only protects the SSR gap before
                  // StartScreen mounts. Keeping it during the hollow-O
                  // reveal blocks the desktop behind the transparent mask.
                  releaseBootCover();
                  setStartScreenReady(true);
                }}
                onReveal={() => {
                  // Pre-reveal desktop layers DI BELAKANG hollow-O
                  // supaya saat lubang membesar, user langsung lihat
                  // wallpaper, icons, dock, menubar — bukan layar kosong.
                  startTransition(() => setIsRevealed(true));
                }}
              />
            </AnimatePresence>
          )}
          <m.div
            className="desktop-main-container relative h-full w-full select-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: isDesktopReady ? 1 : 0 }}
            transition={{
              duration: wasBootSkipped ? 0.4 : 0.2,
              ease: wasBootSkipped ? [0.32, 0.72, 0, 1] : 'easeOut',
            }}
          >
            {isDesktopReady && (
              <DesktopBackground
                wallpaperConfig={aboutData?.wallpaperConfig}
                isWindowOpen={windows.some(
                  (w) => w.id.startsWith('project-') && w.isOpen && !w.isMinimized
                )}
              />
            )}
            {isDesktopRevealed && (
              <>
                <React.Suspense fallback={null}>
                  <DesktopIconsLayer
                    projectIcons={projectIcons}
                    isMobile={isMobile}
                    isReady={isDesktopRevealed}
                    handleIconPositionChange={handleIconPositionChange}
                    openProjectWindow={openProjectWindow}
                  />
                </React.Suspense>
                <React.Suspense fallback={null}>
                  <UnifiedLayer
                    windows={windows}
                    notes={notes}
                    isAdmin={isAdmin}
                    isRevealed={isDesktopRevealed}
                    closeWindow={closeWindow}
                    minimizeWindow={minimizeWindow}
                    maximizeWindow={maximizeWindow}
                    focusWindow={focusWindow}
                    updateWindowPosition={updateWindowPosition}
                    handleWindowResize={handleWindowResize}
                    handleWindowResizeEnd={handleWindowResizeEnd}
                    togglePin={togglePin}
                    updateNote={updateNote}
                    bringToFrontNote={bringToFrontNote}
                    deleteNote={deleteNote}
                    permanentDeleteNote={permanentDeleteNote}
                    restoreNote={restoreNote}
                    addNote={addNote}
                    onWindowClosed={(id) => {
                      // id format: "project-${projectId}"
                      if (id.startsWith('project-')) {
                        const projectId = id.replace('project-', '');
                        setActiveIconIds((prev) => {
                          const next = new Set(prev);
                          next.delete(projectId);
                          return next;
                        });
                      }
                    }}
                  />
                </React.Suspense>
                <UIOverlaysLayer
                  navToChat={navToChat}
                  openWhatsAppList={openWhatsAppList}
                  testimonialContacts={testimonialContacts}
                  aboutData={aboutData}
                  isAdmin={isAdmin}
                  logout={logout}
                  toggleNotesVisibility={toggleNotesVisibility}
                  isMobile={isMobile}
                  commercialProjects={commercialProjects}
                  openProjectWindow={openProjectWindow}
                />
              </>
            )}
          </m.div>
        </>
      )}
    </LazyMotion>
  );
}
