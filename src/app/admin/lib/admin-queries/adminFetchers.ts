import type { AboutData } from '@/types/about';
import type { ContactData } from '@/types/contact';
import type { ExperienceData } from '@/types/experience';
import type { GalleryFeaturedData } from '@/types/gallery';
import type { HardSkill } from '@/types/hardSkill';
import type { Label } from '@/types/labels';
import type { Project } from '@/types/projects';
import type { TestimonialData } from '@/types/testimonial';
import type { NoteData } from '@/components/os/ui/elements/StickyNoteItem';

export interface AdminProjectsResponse {
  data?: {
    projects?: Project[];
    lastUpdated?: string;
  };
}

export interface Lead extends Record<string, unknown> {
  id: string;
  createdAt: string;
  name: string;
  contact: string;
  contactType: 'WhatsApp' | 'Email';
  message: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      typeof errorData?.error === 'string' ? errorData.error : `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function fetchAdminAbout() {
  return fetchJson<AboutData>('/api/about');
}

export function fetchAdminAboutFresh() {
  return fetchJson<AboutData>('/api/about?fresh=true');
}

export function fetchAdminAboutPhilosophy() {
  return fetchJson('/api/about/philosophy');
}

export function fetchAdminCommentCounts() {
  return fetchJson<{
    comments?: Record<string, unknown[]>;
    data?: { comments?: Record<string, unknown[]> };
  }>('/api/comments').then((data) => {
    const counts: Record<string, number> = {};
    const commentsBySlug = data.data?.comments ?? data.comments;

    if (commentsBySlug) {
      Object.entries(commentsBySlug).forEach(([slug, commentsList]) => {
        const commentsArr = Array.isArray(commentsList) ? commentsList : [];
        counts[slug] = commentsArr.reduce<number>(
          (acc, comment) => acc + 1 + ((comment as { replies?: unknown[] }).replies?.length || 0),
          0
        );
      });
    }

    return counts;
  });
}

export function fetchAdminContact() {
  return fetchJson<ContactData>('/api/contact');
}

export function fetchAdminExperience() {
  return fetchJson<ExperienceData>('/api/experience');
}

export function fetchAdminGalleryFeatured() {
  return fetchJson<GalleryFeaturedData>('/api/gallery/featured');
}

export function fetchAdminHardSkills() {
  return fetchJson<HardSkill[]>('/api/hard-skills').then((data) =>
    Array.isArray(data) ? data : []
  );
}

export function fetchAdminLabels() {
  return fetchJson<Label[]>('/api/about/labels').then((data) => (Array.isArray(data) ? data : []));
}

export function fetchAdminLeads() {
  return fetchJson<Lead[]>('/api/leads').then((data) => (Array.isArray(data) ? data : []));
}

export function fetchAdminProjects() {
  return fetchJson<AdminProjectsResponse>('/api/projects');
}

export function fetchAdminProjectsFresh() {
  return fetchJson<AdminProjectsResponse>('/api/projects?fresh=true');
}

export function fetchAdminStickyNotes() {
  return fetchJson<NoteData[]>('/api/sticky-notes').then((data) =>
    Array.isArray(data) ? data : []
  );
}

export function fetchAdminTestimonials() {
  return fetchJson<TestimonialData>('/api/testimonial');
}
