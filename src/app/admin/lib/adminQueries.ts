import type { AboutData } from '@/types/about';
import type { ContactData } from '@/types/contact';
import type { ExperienceData } from '@/types/experience';
import type { GalleryFeaturedData } from '@/types/gallery';
import type { HardSkill } from '@/types/hardSkill';
import type { Label } from '@/types/labels';
import type { Project } from '@/types/projects';
import type { TestimonialData } from '@/types/testimonial';
import type { NoteData } from '@/components/os/ui/elements/StickyNoteItem';
import aboutFallback from '@/data/about.json';
import contactFallback from '@/data/contact.json';
import experienceFallback from '@/data/experience.json';
import galleryFeaturedFallback from '@/data/gallery-featured.json';
import hardSkillsFallback from '@/data/hardSkills.json';
import labelsFallback from '@/data/labels.json';
import projectsFallback from '@/data/projects.json';
import stickyNotesFallback from '@/data/sticky-notes.json';
import testimonialFallback from '@/data/testimonial.json';
import type { AdminProjectsResponse, Lead } from './admin-queries/adminFetchers';

export const ADMIN_DATA_STALE_TIME = 15 * 60 * 1000;
export const ADMIN_DATA_GC_TIME = 60 * 60 * 1000;

export const ADMIN_QUERY_KEYS = {
  about: ['admin', 'about'] as const,
  aboutPhilosophy: ['admin', 'about', 'philosophy'] as const,
  commentCounts: ['comments', 'counts'] as const,
  contact: ['admin', 'contact'] as const,
  experience: ['admin', 'experience'] as const,
  galleryFeatured: ['admin', 'gallery', 'featured'] as const,
  hardSkills: ['admin', 'hard-skills'] as const,
  labels: ['admin', 'labels'] as const,
  leads: ['admin', 'leads'] as const,
  projects: ['projects', 'admin'] as const,
  stickyNotes: ['admin', 'sticky-notes'] as const,
  testimonial: ['admin', 'testimonial'] as const,
};

export const ADMIN_PREFETCH_HREFS = [
  '/admin/projects',
  '/admin/content/experience',
  '/admin/communications/notifications',
  '/admin/communications/contacts',
  '/admin/communications/messages',
  '/admin/content/profile',
  '/admin/content/skills',
  '/admin/content/archive',
  '/admin/system/appearance',
  '/admin/system/widgets',
  '/admin/system/dock',
  '/admin/system/sounds',
  '/admin/content/labels',
] as const;

const placeholderHardSkills = (
  (hardSkillsFallback as unknown as { skills?: Partial<HardSkill>[] }).skills || []
).map((skill) => ({ iconUrl: '', ...skill })) as HardSkill[];

const placeholderTestimonial = testimonialFallback as unknown as TestimonialData;
const placeholderTestimonials = {
  ...placeholderTestimonial,
  testimonials: (placeholderTestimonial.testimonials || []).map((testimonial) => ({
    ...testimonial,
    id: String(testimonial.id),
  })),
} satisfies TestimonialData;

export const ADMIN_PLACEHOLDER_DATA = {
  about: aboutFallback as AboutData,
  contact: contactFallback as ContactData,
  experience: experienceFallback as ExperienceData,
  galleryFeatured: galleryFeaturedFallback as GalleryFeaturedData,
  hardSkills: placeholderHardSkills,
  labels: labelsFallback as Label[],
  leads: [] as Lead[],
  projects: {
    data: {
      projects: (projectsFallback as { projects?: Project[] }).projects || [],
      lastUpdated: new Date(0).toISOString(),
    },
  } satisfies AdminProjectsResponse,
  stickyNotes: stickyNotesFallback as NoteData[],
  testimonial: placeholderTestimonials,
};

export * from './admin-queries/adminFetchers';
export * from './admin-queries/adminPrefetch';
