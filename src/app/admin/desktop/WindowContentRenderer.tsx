'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import AdminLoading from '@/components/admin/AdminLoading';

// ─── Lazy-loaded CRUD client components ───
// Each component is the actual CRUD panel rendered inside an admin window.
// They are lazy-loaded so opening a folder doesn't pull in all CRUD bundles.

const ProjectsPanel = dynamic(() => import('@/app/admin/projects/AdminProjectsClient'), {
  loading: () => <AdminLoading size="page" />,
});

const ProfilePanel = dynamic(() => import('./panels/ProfilePanel'), {
  loading: () => <AdminLoading size="page" />,
});

const ExperiencePanel = dynamic(
  () => import('@/app/admin/content/experience/AdminExperienceClient'),
  { loading: () => <AdminLoading size="page" /> }
);

const SkillsPanel = dynamic(() => import('./panels/SkillsPanel'), {
  loading: () => <AdminLoading size="page" />,
});

const ArchivePanel = dynamic(() => import('./panels/ArchivePanel'), {
  loading: () => <AdminLoading size="page" />,
});

const LabelsPanel = dynamic(() => import('./panels/LabelsPanel'), {
  loading: () => <AdminLoading size="page" />,
});

const ExplorerPanel = dynamic(() => import('@/app/admin/projects/explorer/AdminExplorerClient'), {
  loading: () => <AdminLoading size="page" />,
});

const EventPagesPanel = dynamic(
  () => import('@/app/admin/projects/event-pages/AdminEventPagesClient'),
  { loading: () => <AdminLoading size="page" /> }
);

const AppearancePanel = dynamic(() => import('./panels/AppearancePanel'), {
  loading: () => <AdminLoading size="page" />,
});

const DockPanel = dynamic(() => import('./panels/DockPanel'), {
  loading: () => <AdminLoading size="page" />,
});

const WidgetsPanel = dynamic(() => import('./panels/WidgetsPanel'), {
  loading: () => <AdminLoading size="page" />,
});

const SoundsPanel = dynamic(() => import('./panels/SoundsPanel'), {
  loading: () => <AdminLoading size="page" />,
});

const NotificationsPanel = dynamic(() => import('./panels/NotificationsPanel'), {
  loading: () => <AdminLoading size="page" />,
});

const MessagesPanel = dynamic(
  () => import('@/app/admin/communications/messages/AdminLeadsClient'),
  { loading: () => <AdminLoading size="page" /> }
);

const FeedbackPanel = dynamic(
  () => import('@/app/admin/communications/feedback/AdminFeedbackClient'),
  { loading: () => <AdminLoading size="page" /> }
);

const ContactsPanel = dynamic(
  () => import('@/app/admin/communications/contacts/AdminContactClient'),
  { loading: () => <AdminLoading size="page" /> }
);

const PANEL_MAP: Record<string, React.ComponentType> = {
  projects: ProjectsPanel,
  profile: ProfilePanel,
  experience: ExperiencePanel,
  skills: SkillsPanel,
  archive: ArchivePanel,
  labels: LabelsPanel,
  explorer: ExplorerPanel,
  eventPages: EventPagesPanel,
  appearance: AppearancePanel,
  dock: DockPanel,
  widgets: WidgetsPanel,
  sounds: SoundsPanel,
  notifications: NotificationsPanel,
  messages: MessagesPanel,
  feedback: FeedbackPanel,
  contacts: ContactsPanel,
};

interface WindowContentRendererProps {
  appId: string;
}

export default function WindowContentRenderer({ appId }: WindowContentRendererProps) {
  const Panel = PANEL_MAP[appId];

  if (!Panel) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        Panel &quot;{appId}&quot; belum tersedia
      </div>
    );
  }

  return (
    <Suspense fallback={<AdminLoading size="page" />}>
      <div className="admin-window-panel-scroll" data-lenis-prevent>
        <Panel />
      </div>
    </Suspense>
  );
}
