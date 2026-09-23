import type { QueryClient, QueryKey } from '@tanstack/react-query';
import {
  ADMIN_DATA_GC_TIME,
  ADMIN_DATA_STALE_TIME,
  ADMIN_QUERY_KEYS,
} from '../adminQueries';
import {
  fetchAdminAbout,
  fetchAdminAboutPhilosophy,
  fetchAdminCommentCounts,
  fetchAdminContact,
  fetchAdminExperience,
  fetchAdminGalleryFeatured,
  fetchAdminHardSkills,
  fetchAdminLabels,
  fetchAdminLeads,
  fetchAdminProjects,
  fetchAdminStickyNotes,
  fetchAdminTestimonials,
} from './adminFetchers';

function prefetch<T>(queryClient: QueryClient, queryKey: QueryKey, queryFn: () => Promise<T>) {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: ADMIN_DATA_STALE_TIME,
    gcTime: ADMIN_DATA_GC_TIME,
  });
}

function prefetchJobsForRoute(href: string) {
  if (href.startsWith('/admin/projects')) {
    return [
      (queryClient: QueryClient) =>
        prefetch(queryClient, ADMIN_QUERY_KEYS.projects, fetchAdminProjects),
      (queryClient: QueryClient) =>
        prefetch(queryClient, ADMIN_QUERY_KEYS.labels, fetchAdminLabels),
      (queryClient: QueryClient) =>
        prefetch(queryClient, ADMIN_QUERY_KEYS.commentCounts, fetchAdminCommentCounts),
    ];
  }

  if (href.startsWith('/admin/content/profile')) {
    return [
      (queryClient: QueryClient) => prefetch(queryClient, ADMIN_QUERY_KEYS.about, fetchAdminAbout),
      (queryClient: QueryClient) =>
        prefetch(queryClient, ADMIN_QUERY_KEYS.projects, fetchAdminProjects),
      (queryClient: QueryClient) =>
        prefetch(queryClient, ADMIN_QUERY_KEYS.aboutPhilosophy, fetchAdminAboutPhilosophy),
    ];
  }

  if (href.startsWith('/admin/content/skills')) {
    return [
      (queryClient: QueryClient) => prefetch(queryClient, ADMIN_QUERY_KEYS.about, fetchAdminAbout),
      (queryClient: QueryClient) =>
        prefetch(queryClient, ADMIN_QUERY_KEYS.hardSkills, fetchAdminHardSkills),
    ];
  }

  if (href.startsWith('/admin/content/archive')) {
    return [
      (queryClient: QueryClient) =>
        prefetch(queryClient, ADMIN_QUERY_KEYS.projects, fetchAdminProjects),
      (queryClient: QueryClient) =>
        prefetch(queryClient, ADMIN_QUERY_KEYS.galleryFeatured, fetchAdminGalleryFeatured),
    ];
  }

  if (href.startsWith('/admin/content/experience')) {
    return [
      (queryClient: QueryClient) =>
        prefetch(queryClient, ADMIN_QUERY_KEYS.experience, fetchAdminExperience),
    ];
  }

  if (href.startsWith('/admin/content/labels')) {
    return [
      (queryClient: QueryClient) =>
        prefetch(queryClient, ADMIN_QUERY_KEYS.labels, fetchAdminLabels),
    ];
  }

  if (href.startsWith('/admin/system/appearance')) {
    return [
      (queryClient: QueryClient) => prefetch(queryClient, ADMIN_QUERY_KEYS.about, fetchAdminAbout),
      (queryClient: QueryClient) =>
        prefetch(queryClient, ADMIN_QUERY_KEYS.projects, fetchAdminProjects),
    ];
  }

  if (href.startsWith('/admin/system/widgets')) {
    return [
      (queryClient: QueryClient) => prefetch(queryClient, ADMIN_QUERY_KEYS.about, fetchAdminAbout),
      (queryClient: QueryClient) =>
        prefetch(queryClient, ADMIN_QUERY_KEYS.stickyNotes, fetchAdminStickyNotes),
    ];
  }

  if (href.startsWith('/admin/system/dock') || href.startsWith('/admin/system/sounds')) {
    return [
      (queryClient: QueryClient) => prefetch(queryClient, ADMIN_QUERY_KEYS.about, fetchAdminAbout),
    ];
  }

  if (href.startsWith('/admin/communications/notifications')) {
    return [
      (queryClient: QueryClient) =>
        prefetch(queryClient, ADMIN_QUERY_KEYS.testimonial, fetchAdminTestimonials),
      (queryClient: QueryClient) =>
        prefetch(queryClient, ADMIN_QUERY_KEYS.projects, fetchAdminProjects),
      (queryClient: QueryClient) => prefetch(queryClient, ADMIN_QUERY_KEYS.about, fetchAdminAbout),
    ];
  }

  if (href.startsWith('/admin/communications/contacts')) {
    return [
      (queryClient: QueryClient) =>
        prefetch(queryClient, ADMIN_QUERY_KEYS.contact, fetchAdminContact),
    ];
  }

  if (href.startsWith('/admin/communications/messages')) {
    return [
      (queryClient: QueryClient) => prefetch(queryClient, ADMIN_QUERY_KEYS.leads, fetchAdminLeads),
    ];
  }

  if (href.startsWith('/admin/communications/feedback')) {
    return [];
  }

  return [];
}

export function prefetchAdminRoute(queryClient: QueryClient, href: string) {
  const jobs = prefetchJobsForRoute(href);
  if (jobs.length === 0) return Promise.resolve([]);

  return Promise.allSettled(jobs.map((job) => job(queryClient)));
}

export function warmAdminCrudQueries(queryClient: QueryClient) {
  return Promise.allSettled([
    prefetch(queryClient, ADMIN_QUERY_KEYS.projects, fetchAdminProjects),
    prefetch(queryClient, ADMIN_QUERY_KEYS.about, fetchAdminAbout),
    prefetch(queryClient, ADMIN_QUERY_KEYS.experience, fetchAdminExperience),
    prefetch(queryClient, ADMIN_QUERY_KEYS.testimonial, fetchAdminTestimonials),
    prefetch(queryClient, ADMIN_QUERY_KEYS.contact, fetchAdminContact),
    prefetch(queryClient, ADMIN_QUERY_KEYS.leads, fetchAdminLeads),
    prefetch(queryClient, ADMIN_QUERY_KEYS.labels, fetchAdminLabels),
    prefetch(queryClient, ADMIN_QUERY_KEYS.commentCounts, fetchAdminCommentCounts),
  ]);
}
