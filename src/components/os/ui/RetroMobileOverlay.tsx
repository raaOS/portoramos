'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BriefcaseBusiness,
  ChevronRight,
  FileText,
  FolderKanban,
  Grid2X2,
  Grid3X3,
  Mail,
  MessageCircle,
  Sparkles,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import type { AboutData } from '@/types/about';
import type { ContactData } from '@/types/contact';
import type { ExperienceData } from '@/types/experience';
import type { HardSkillsData } from '@/types/hardSkill';
import type { Project } from '@/types/projects';
import { cn } from '@/lib/utils';
import { resolveCover } from '@/lib/images';
import DesktopAppIcon from './AppIcon';
import WhatsAppIcon from './WhatsAppIcon';
import { DEFAULT_WALLPAPER_URL, Z_LAYERS } from '../utils/zIndexLayers';

type MiniAppId = 'about' | 'projects' | 'cv' | 'contact' | 'skills' | 'whatsapp' | 'notes';

interface MiniMacOSMobileProps {
  aboutData?: AboutData | null;
  experienceData?: ExperienceData | null;
  hardSkillsData?: HardSkillsData | null;
  projects: Project[];
  contactData?: ContactData | null;
}

interface MiniApp {
  id: MiniAppId;
  label: string;
  icon: LucideIcon;
  tint: string;
}

const MINI_APPS: MiniApp[] = [
  {
    id: 'about',
    label: 'About',
    icon: UserRound,
    tint: 'from-sky-400 to-cyan-500',
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: FolderKanban,
    tint: 'from-amber-300 to-orange-500',
  },
  {
    id: 'cv',
    label: 'CV',
    icon: FileText,
    tint: 'from-emerald-300 to-teal-500',
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: Mail,
    tint: 'from-rose-300 to-red-500',
  },
  {
    id: 'skills',
    label: 'Skillset',
    icon: Sparkles,
    tint: 'from-violet-300 to-indigo-500',
  },
];

const DOCK_APP_IDS: MiniAppId[] = ['projects', 'about', 'whatsapp', 'contact', 'notes'];

function getSafeMediaUrl(url?: string | null) {
  if (!url) return null;
  const trimmed = url.trim();
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/')
  ) {
    return trimmed;
  }
  return null;
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) || url.startsWith('data:video');
}

function getActiveWallpaper(aboutData?: AboutData | null) {
  const wallpaper = aboutData?.wallpaperConfig?.collection?.find(
    (item) => item.id === aboutData.wallpaperConfig?.activeWallpaperId
  );
  return getSafeMediaUrl(wallpaper?.url) ?? DEFAULT_WALLPAPER_URL;
}

function getWhatsAppHref(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.startsWith('http')) return trimmed;
  const digits = trimmed.replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : null;
}

function projectHref(project: Project) {
  return project.slug ? `/projects/${project.slug}` : '/projects';
}

function getDockLabel(aboutData: AboutData | null | undefined, id: MiniAppId, fallback: string) {
  return aboutData?.dockConfig?.[id]?.label || fallback;
}

function getDockIconUrl(aboutData: AboutData | null | undefined, id: MiniAppId) {
  return getSafeMediaUrl(aboutData?.dockConfig?.[id]?.iconUrl);
}

function AppIcon({ app, onOpen }: { app: MiniApp; onOpen: (id: MiniAppId) => void }) {
  const Icon = app.icon;
  return (
    <button
      type="button"
      className="group flex min-h-[108px] flex-col items-center justify-start gap-2 rounded-3xl p-2 text-white outline-none transition active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-white/80"
      onClick={() => onOpen(app.id)}
      aria-label={`Open ${app.label}`}
    >
      <span
        className={cn(
          'grid h-[66px] w-[66px] place-items-center rounded-[22px] bg-gradient-to-br shadow-[0_14px_30px_rgba(0,0,0,0.28)] ring-1 ring-white/35 transition group-active:shadow-[0_8px_18px_rgba(0,0,0,0.28)]',
          app.tint
        )}
      >
        <Icon className="h-8 w-8" strokeWidth={1.9} aria-hidden="true" />
      </span>
      <span className="w-full truncate px-1 text-center text-[12px] font-medium leading-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
        {app.label}
      </span>
    </button>
  );
}

function StatusBar({ availability }: { availability?: string }) {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between px-5 pt-[max(env(safe-area-inset-top),8px)] text-white">
      <div className="flex min-w-0 items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)]" />
        <span className="truncate text-[12px] font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          {availability || 'Available for selected work'}
        </span>
      </div>
      <span className="text-[12px] font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
        Ramos OS
      </span>
    </div>
  );
}

function Dock({
  apps,
  activeApp,
  onOpen,
  aboutData,
}: {
  apps: MiniApp[];
  activeApp: MiniAppId | null;
  onOpen: (id: MiniAppId) => void;
  aboutData?: AboutData | null;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),14px)]">
      <nav
        className="flex h-[74px] w-full max-w-[348px] items-center justify-center gap-2 rounded-[30px] border border-white/35 bg-white/22 px-3 shadow-[0_20px_60px_rgba(0,0,0,0.32)] backdrop-blur-2xl"
        aria-label="Mini macOS dock"
      >
        {apps.map((app) => {
          const Icon = app.icon;
          const active = activeApp === app.id;
          const iconUrl = getDockIconUrl(aboutData, app.id);
          const label = getDockLabel(aboutData, app.id, app.label);
          return (
            <button
              key={app.id}
              type="button"
              className="relative grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[18px] text-white shadow-[0_10px_24px_rgba(0,0,0,0.22)] outline-none ring-1 ring-white/35 transition active:scale-95 focus-visible:ring-2 focus-visible:ring-white"
              onClick={() => onOpen(app.id)}
              aria-label={`Open ${label}`}
              aria-current={active ? 'page' : undefined}
            >
              {iconUrl ? (
                <DesktopAppIcon imageUrl={iconUrl} priority={app.id === 'projects'} />
              ) : app.id === 'whatsapp' ? (
                <span className="grid h-full w-full place-items-center rounded-[18px] bg-[#25D366] p-2.5">
                  <WhatsAppIcon />
                </span>
              ) : (
                <DesktopAppIcon icon={Icon} color={app.tint} />
              )}
              {active && (
                <span className="absolute -bottom-2 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function WindowShell({
  app,
  children,
  onClose,
}: {
  app: MiniApp;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <m.section
      key={app.id}
      initial={{ y: 42, opacity: 0, scale: 0.98 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 28, opacity: 0, scale: 0.985 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-3 bottom-[104px] top-[58px] z-30 flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/30 bg-zinc-950/92 text-white shadow-[0_28px_80px_rgba(0,0,0,0.62)] backdrop-blur-3xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`mini-window-${app.id}`}
    >
      <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-white/15 bg-white/12 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-red-400 text-red-950 outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-white"
            onClick={onClose}
            aria-label="Close app"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-amber-300" />
          <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-emerald-300" />
          <h2 id={`mini-window-${app.id}`} className="ml-1 truncate text-[14px] font-semibold">
            {app.label}
          </h2>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
    </m.section>
  );
}

function SectionTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/58">{eyebrow}</p>
      <h3 className="mt-1 text-[24px] font-semibold leading-tight text-white">{title}</h3>
      {children && <div className="mt-2 text-[14px] leading-relaxed text-white/74">{children}</div>}
    </div>
  );
}

function AboutPanel({ aboutData }: { aboutData?: AboutData | null }) {
  const bio = aboutData?.professional?.bio?.content;
  const motto = aboutData?.professional?.motto?.quote;
  const title = aboutData?.hero?.title || 'Ramos Portfolio';

  return (
    <div className="space-y-4">
      <SectionTitle eyebrow="Profile" title={title}>
        {bio || 'Digital portfolio with selected work, design thinking, and contact access.'}
      </SectionTitle>
      {motto && (
        <blockquote className="rounded-[22px] border border-white/14 bg-white/10 p-4 text-[15px] font-medium leading-relaxed text-white/88">
          {motto}
        </blockquote>
      )}
      <Link
        href="/about"
        className="flex items-center justify-between rounded-[20px] border border-white/14 bg-white/10 px-4 py-3 text-[14px] font-semibold text-white transition active:scale-[0.99]"
      >
        Open full profile
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

function ProjectsPanel({ projects }: { projects: Project[] }) {
  const visibleProjects = useMemo(
    () => projects.filter((project) => project.status !== 'draft').slice(0, 5),
    [projects]
  );

  return (
    <div>
      <SectionTitle eyebrow="Selected Work" title="Projects">
        Tap a case study for the full page. The mobile OS keeps previews compact so the window
        stays fast.
      </SectionTitle>
      <div className="space-y-3">
        {visibleProjects.map((project) => {
          const cover = resolveCover(project);
          const preview = getSafeMediaUrl(cover.kind === 'video' ? cover.poster : cover.src);

          return (
            <Link
              key={project.id}
              href={projectHref(project)}
              className="group flex min-h-[96px] gap-3 rounded-[22px] border border-white/14 bg-white/10 p-3 text-white transition active:scale-[0.99]"
            >
              <div className="relative h-[72px] w-[86px] shrink-0 overflow-hidden rounded-[16px] bg-white/12">
                {preview ? (
                  <span
                    className="absolute inset-0 bg-cover bg-center transition group-active:scale-105"
                    style={{ backgroundImage: `url("${preview}")` }}
                    aria-hidden="true"
                  />
                ) : (
                  <span className="absolute inset-0 grid place-items-center">
                    <Grid2X2 className="h-6 w-6 text-white/55" aria-hidden="true" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[15px] font-semibold leading-snug">{project.title}</p>
                <p className="mt-1 truncate text-[12px] text-white/58">
                  {[project.client, project.year].filter(Boolean).join(' / ')}
                </p>
                <p className="mt-2 line-clamp-1 text-[12px] text-white/70">
                  {project.tags?.slice(0, 3).join(', ') || 'Case study'}
                </p>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-white/58" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
      <Link
        href="/projects"
        className="mt-4 flex items-center justify-center rounded-[20px] bg-white px-4 py-3 text-[14px] font-semibold text-zinc-950 transition active:scale-[0.99]"
      >
        View all projects
      </Link>
    </div>
  );
}

function CvPanel({ experienceData }: { experienceData?: ExperienceData | null }) {
  const experiences = experienceData?.workExperience?.slice(0, 3) ?? [];

  return (
    <div>
      <SectionTitle eyebrow="Resume" title="CV Snapshot">
        {experienceData?.statistics?.years
          ? `${experienceData.statistics.years} years of hands-on creative and product work.`
          : 'Quick career snapshot with full resume available on the CV page.'}
      </SectionTitle>
      <div className="space-y-3">
        {experiences.map((item) => (
          <div key={item.id} className="rounded-[20px] border border-white/14 bg-white/10 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-[14px] bg-emerald-300/90 text-emerald-950">
                <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-white">{item.position}</p>
                <p className="mt-0.5 truncate text-[12px] text-white/60">
                  {item.company} / {item.year}
                </p>
                <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-white/72">
                  {item.description?.[0] || item.duration}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Link
        href="/cv"
        className="mt-4 flex items-center justify-center rounded-[20px] bg-white px-4 py-3 text-[14px] font-semibold text-zinc-950 transition active:scale-[0.99]"
      >
        Open full CV
      </Link>
    </div>
  );
}

function ContactPanel({
  aboutData,
  contactData,
}: {
  aboutData?: AboutData | null;
  contactData?: ContactData | null;
}) {
  const email = contactData?.info?.email || aboutData?.professional?.contacts?.email;
  const whatsAppHref = getWhatsAppHref(
    contactData?.info?.socialMedia?.whatsapp || aboutData?.professional?.contacts?.whatsapp
  );
  const linkedin = contactData?.info?.socialMedia?.linkedin || aboutData?.professional?.contacts?.linkedin;

  return (
    <div>
      <SectionTitle eyebrow="Contact" title={contactData?.content?.headline || 'Start a conversation'}>
        {contactData?.content?.subtext ||
          'Pick the fastest channel and continue the conversation from mobile.'}
      </SectionTitle>
      <div className="space-y-3">
        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center justify-between rounded-[20px] border border-white/14 bg-white/10 px-4 py-3 text-[14px] font-semibold text-white"
          >
            Email
            <span className="max-w-[190px] truncate text-right text-[12px] font-medium text-white/62">
              {email}
            </span>
          </a>
        )}
        {whatsAppHref && (
          <a
            href={whatsAppHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-[20px] bg-emerald-300 px-4 py-3 text-[14px] font-semibold text-emerald-950"
          >
            WhatsApp
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
        {linkedin && (
          <a
            href={linkedin}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-[20px] border border-white/14 bg-white/10 px-4 py-3 text-[14px] font-semibold text-white"
          >
            LinkedIn
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
        <Link
          href="/contact"
          className="flex items-center justify-center rounded-[20px] bg-white px-4 py-3 text-[14px] font-semibold text-zinc-950 transition active:scale-[0.99]"
        >
          Open contact page
        </Link>
      </div>
    </div>
  );
}

function WhatsAppPanel({
  aboutData,
  contactData,
}: {
  aboutData?: AboutData | null;
  contactData?: ContactData | null;
}) {
  const whatsAppHref = getWhatsAppHref(
    contactData?.info?.socialMedia?.whatsapp || aboutData?.professional?.contacts?.whatsapp
  );

  return (
    <div>
      <SectionTitle eyebrow="WhatsApp" title="Fast chat">
        Continue from mobile with the quickest contact channel.
      </SectionTitle>
      {whatsAppHref ? (
        <a
          href={whatsAppHref}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-[22px] bg-emerald-300 px-4 py-4 text-[15px] font-semibold text-emerald-950"
        >
          Open WhatsApp
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
        </a>
      ) : (
        <div className="rounded-[20px] border border-white/14 bg-white/10 p-4 text-[14px] text-white/72">
          WhatsApp contact is not configured yet.
        </div>
      )}
    </div>
  );
}

function NotesPanel() {
  return (
    <div>
      <SectionTitle eyebrow="Notes" title="Quick notes">
        A compact mobile version of the desktop notes shortcut.
      </SectionTitle>
      <div className="space-y-3">
        <Link
          href="/projects"
          className="flex items-center justify-between rounded-[20px] border border-white/14 bg-white/10 px-4 py-3 text-[14px] font-semibold text-white"
        >
          Project notes
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          href="/contact"
          className="flex items-center justify-between rounded-[20px] border border-white/14 bg-white/10 px-4 py-3 text-[14px] font-semibold text-white"
        >
          Leave a message
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function SkillsPanel({ hardSkillsData }: { hardSkillsData?: HardSkillsData | null }) {
  const skills = hardSkillsData?.skills?.filter((skill) => skill.isActive !== false).slice(0, 12) ?? [];

  return (
    <div>
      <SectionTitle eyebrow="Tools" title="Skillset">
        Core tools and capabilities shown as compact chips for mobile scanning.
      </SectionTitle>
      <div className="grid grid-cols-2 gap-2.5">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className="min-h-[68px] rounded-[18px] border border-white/14 bg-white/10 p-3"
          >
            <p className="truncate text-[14px] font-semibold text-white">{skill.name}</p>
            <p className="mt-1 text-[12px] text-white/58">{skill.level}</p>
          </div>
        ))}
      </div>
      <Link
        href="/about"
        className="mt-4 flex items-center justify-center rounded-[20px] bg-white px-4 py-3 text-[14px] font-semibold text-zinc-950 transition active:scale-[0.99]"
      >
        View full profile
      </Link>
    </div>
  );
}

function WindowContent({
  activeApp,
  aboutData,
  experienceData,
  hardSkillsData,
  projects,
  contactData,
}: MiniMacOSMobileProps & { activeApp: MiniAppId }) {
  if (activeApp === 'about') return <AboutPanel aboutData={aboutData} />;
  if (activeApp === 'projects') return <ProjectsPanel projects={projects} />;
  if (activeApp === 'cv') return <CvPanel experienceData={experienceData} />;
  if (activeApp === 'contact') return <ContactPanel aboutData={aboutData} contactData={contactData} />;
  if (activeApp === 'whatsapp') {
    return <WhatsAppPanel aboutData={aboutData} contactData={contactData} />;
  }
  if (activeApp === 'notes') return <NotesPanel />;
  return <SkillsPanel hardSkillsData={hardSkillsData} />;
}

export default function RetroMobileOverlay({
  aboutData,
  experienceData,
  hardSkillsData,
  projects,
  contactData,
}: MiniMacOSMobileProps) {
  const [activeApp, setActiveApp] = useState<MiniAppId | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const wallpaper = useMemo(() => getActiveWallpaper(aboutData), [aboutData]);
  const dockApps = useMemo(
    () => {
      const dockFallbacks: Record<MiniAppId, MiniApp> = {
        about: { id: 'about', label: 'About Me', icon: UserRound, tint: 'from-gray-300 to-gray-400' },
        projects: { id: 'projects', label: 'Projects', icon: Grid3X3, tint: 'from-zinc-700 to-zinc-900' },
        whatsapp: { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, tint: 'from-emerald-300 to-green-500' },
        contact: { id: 'contact', label: 'Contact', icon: Mail, tint: 'from-blue-400 to-indigo-500' },
        notes: { id: 'notes', label: 'Notes', icon: FileText, tint: 'from-yellow-300 to-orange-400' },
        cv: { id: 'cv', label: 'CV', icon: FileText, tint: 'from-emerald-300 to-teal-500' },
        skills: { id: 'skills', label: 'Skillset', icon: Sparkles, tint: 'from-violet-300 to-indigo-500' },
      };
      return DOCK_APP_IDS.map((id) => dockFallbacks[id]);
    },
    []
  );
  const activeAppConfig = activeApp ? MINI_APPS.find((app) => app.id === activeApp) : null;
  const availability = aboutData?.hero?.availability?.text;
  const title = aboutData?.hero?.title || 'Ramos Portfolio';
  const wallpaperIsVideo = isVideoUrl(wallpaper);

  /*
   * MOBILE MINI MACOS NOTE FOR FUTURE AI:
   * Mobile is intentionally a separate Ramos Pocket OS, not a blocker asking
   * visitors to open desktop. The desktop multi-window system remains desktop-
   * first, while this component gives phones a fast app-grid + dock + sheet UX.
   * Keep future mobile changes here unless the desktop window system becomes
   * fully touch-native.
   */
  return (
    <main
      className="fixed inset-0 isolate flex min-h-[100svh] touch-pan-y select-none flex-col overflow-hidden bg-zinc-950 text-white"
      style={{ zIndex: Z_LAYERS.CHROME }}
      data-testid="mini-macos-mobile"
    >
      <div className="absolute inset-0 -z-20 overflow-hidden">
        {wallpaperIsVideo ? (
          <video
            src={wallpaper}
            autoPlay={!prefersReducedMotion}
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url("${wallpaper}")` }}
            aria-hidden="true"
          />
        )}
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.18),rgba(0,0,0,0.34)_58%,rgba(0,0,0,0.62))]" />

      <StatusBar availability={availability} />

      <section className="flex min-h-0 flex-1 flex-col px-5 pb-[106px] pt-3">
        <div className="mb-5 min-h-[86px]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            Mini macOS
          </p>
          <h1 className="mt-1 max-w-[330px] text-[34px] font-semibold leading-[0.98] text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.7)]">
            {title}
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-x-3 gap-y-4" aria-label="Mini macOS apps">
          {MINI_APPS.map((app) => (
            <AppIcon key={app.id} app={app} onOpen={setActiveApp} />
          ))}
        </div>
      </section>

      <Dock apps={dockApps} activeApp={activeApp} onOpen={setActiveApp} aboutData={aboutData} />

      <AnimatePresence>
        {activeAppConfig && activeApp && (
          <>
            <m.div
              key="mini-window-scrim"
              className="fixed inset-0 z-[25] bg-black/52 backdrop-blur-[3px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              aria-hidden="true"
            />
            <WindowShell app={activeAppConfig} onClose={() => setActiveApp(null)}>
              <WindowContent
                activeApp={activeApp}
                aboutData={aboutData}
                experienceData={experienceData}
                hardSkillsData={hardSkillsData}
                projects={projects}
                contactData={contactData}
              />
            </WindowShell>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
