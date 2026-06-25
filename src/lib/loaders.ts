import { cache } from 'react';
import { getCachedAboutData } from './services/aboutService';
import { projectService } from './services/projectService';
import { experienceService } from './services/experienceService';
import { hardSkillService } from './services/hardSkillService';
import { testimonialService } from './services/testimonialService';
import { getD1Values, isD1Configured } from './cloudflareD1';
import { ProjectSchema } from '@/lib/validations';
import experienceFallback from '@/data/experience.json';
import hardSkillsFallback from '@/data/hardSkills.json';
import testimonialFallback from '@/data/testimonial.json';
import type { AboutData } from '@/types/about';
import type { ExperienceData, WorkExperience } from '@/types/experience';
import type { HardSkill, HardSkillsData } from '@/types/hardSkill';
import type { Project, ProjectsData } from '@/types/projects';
import type { Testimonial, TestimonialData } from '@/types/testimonial';

export type HomepageData = {
  aboutData: AboutData;
  projects: Project[];
  experienceData: ExperienceData;
  hardSkillsData: HardSkillsData;
  testimonialsData: TestimonialData;
};

const HOMEPAGE_D1_KEYS = [
  // Sengaja skip `content/about` di batch — layout (site) sudah panggil
  // aboutService.getAboutData() yang punya cache layer ContentService (5s) +
  // path invalidation eksplisit via invalidateAboutCache(). Bagikan instance
  // itu supaya admin update langsung kelihatan tanpa double fetch.
  'projects',
  'lastUpdated',
  // Baca row 'content' secara utuh lalu ekstrak nested fields di bawah.
  // getD1Values mencari row LITERAL — `content/experience` tidak ada
  // sebagai row terpisah karena ContentService menulis nested field
  // experience/hardSkills/testimonial di bawah row `content`.
  'content',
];

function deepMerge<T>(base: T, override: unknown): T {
  if (override === null || override === undefined) return base;
  if (base === null || base === undefined) return override as T;
  if (Array.isArray(override)) return override as T;
  if (typeof override !== 'object' || typeof base !== 'object') return override as T;

  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(override as Record<string, unknown>)) {
    result[key] = deepMerge(result[key], (override as Record<string, unknown>)[key]);
  }
  return result as T;
}

function slugifyWorkField(value: unknown) {
  if (typeof value !== 'string') return '';
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeWorkExperience(workExperience: WorkExperience[]): WorkExperience[] {
  return workExperience.map((work, index) => {
    const parts = [work.company, work.position, work.year].map(slugifyWorkField).filter(Boolean);
    const fallbackId = parts.length > 0 ? `${parts.join('-')}-${index}` : `experience-${index}`;
    return {
      ...work,
      id: work.id?.trim() || fallbackId,
    };
  });
}

const DEFAULT_ICON_URLS: Record<string, string> = {
  'hard-ps': 'https://cdn.simpleicons.org/adobephotoshop',
  'hard-ai': 'https://cdn.simpleicons.org/adobeillustrator',
  'hard-figma': 'https://cdn.simpleicons.org/figma',
  'hard-canva': 'https://cdn.simpleicons.org/canva',
};

function getDefaultIconUrl(skill: Pick<HardSkill, 'id' | 'name'>) {
  const normalizedName = skill.name.toLowerCase();
  if (DEFAULT_ICON_URLS[skill.id]) return DEFAULT_ICON_URLS[skill.id];
  if (normalizedName.includes('photoshop')) return DEFAULT_ICON_URLS['hard-ps'];
  if (normalizedName.includes('illustrator')) return DEFAULT_ICON_URLS['hard-ai'];
  if (normalizedName.includes('figma')) return DEFAULT_ICON_URLS['hard-figma'];
  if (normalizedName.includes('canva')) return DEFAULT_ICON_URLS['hard-canva'];
  return 'https://cdn.simpleicons.org/adobecreativecloud';
}

function normalizeHardSkill(
  skill: Partial<HardSkill> & { id: string; name: string },
  index: number
): HardSkill {
  const now = new Date().toISOString();
  return {
    id: skill.id,
    name: skill.name,
    iconUrl: skill.iconUrl || getDefaultIconUrl(skill),
    level: skill.level || 'Intermediate',
    order: typeof skill.order === 'number' ? skill.order : index + 1,
    description: skill.description,
    description_id: skill.description_id,
    isActive: skill.isActive,
    details: skill.details,
    createdAt: skill.createdAt || now,
    updatedAt: skill.updatedAt || now,
  };
}

function normalizeTestimonialData(data: TestimonialData): TestimonialData {
  return {
    ...data,
    testimonials: data.testimonials.map((testimonial: Testimonial) => ({
      ...testimonial,
      id: String(testimonial.id).trim(),
    })),
  };
}

function normalizeProjects(rawProjects: unknown, lastUpdated: unknown): ProjectsData {
  const projectsObject =
    rawProjects && typeof rawProjects === 'object' ? (rawProjects as Record<string, unknown>) : {};
  const projects: Project[] = [];

  Object.values(projectsObject).forEach((project) => {
    const parsed = ProjectSchema.safeParse(project);
    if (parsed.success) {
      projects.push(parsed.data as unknown as Project);
    }
  });

  projects.sort(
    (a, b) =>
      (a.order || 0) - (b.order || 0) ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    projects,
    lastUpdated: typeof lastUpdated === 'string' ? lastUpdated : new Date().toISOString(),
  };
}

async function loadHomepageDataFromD1(): Promise<HomepageData> {
  // Parallel: batch read 5 keys + cached about loader (yang juga reuse cache
  // layer antar layout & page lewat React cache()).
  const [values, aboutData] = await Promise.all([
    getD1Values(HOMEPAGE_D1_KEYS),
    getCachedAboutData(),
  ]);

  const contentRow = (values['content'] as Record<string, unknown>) ?? {};
  const experienceData = deepMerge(
    experienceFallback as unknown as ExperienceData,
    contentRow.experience
  );
  const hardSkillsData = deepMerge(
    hardSkillsFallback as unknown as HardSkillsData,
    contentRow.hardSkills
  );
  const testimonialsData = deepMerge(
    testimonialFallback as unknown as TestimonialData,
    contentRow.testimonial
  );
  const projectsResult = normalizeProjects(values.projects, values.lastUpdated);

  return {
    aboutData,
    projects: projectsResult.projects.filter((p) => p.status !== 'draft'),
    experienceData: {
      ...experienceData,
      workExperience: normalizeWorkExperience(experienceData.workExperience || []),
    },
    hardSkillsData: {
      ...hardSkillsData,
      skills: (hardSkillsData.skills || []).map((skill, index) => normalizeHardSkill(skill, index)),
      lastUpdated: hardSkillsData.lastUpdated || new Date().toISOString(),
    },
    testimonialsData: normalizeTestimonialData(testimonialsData),
  };
}

async function loadHomepageDataFromServices(): Promise<HomepageData> {
  const [aboutData, projectsResult, experienceData, hardSkillsData, testimonialsData] =
    await Promise.all([
      getCachedAboutData(),
      projectService.getProjects(),
      experienceService.getExperienceData(),
      hardSkillService.getHardSkills(),
      testimonialService.getTestimonials(),
    ]);

  return {
    aboutData,
    projects: (projectsResult.projects || []).filter((p) => p.status !== 'draft'),
    experienceData,
    hardSkillsData,
    testimonialsData,
  };
}

/**
 * Consolidates homepage data fetching into one D1 batch read for cold paths.
 * Falls back to service-level loaders if D1 env/network is unavailable.
 *
 * Caching strategy:
 * - **Per-request dedup** via React `cache()` — kalau dipanggil dari layout DAN page
 *   dalam satu request (mis. `(site)/layout.tsx` + `(site)/page.tsx` saat render
 *   homepage), cuma satu kali batch D1 read terjadi.
 * - **Cross-request caching** diserahkan ke ISR (`revalidate = 60`) di Vercel Edge,
 *   yang konsisten dengan `revalidatePath('/', 'layout')` di admin routes.
 *
 * Catatan: module-level cache di-drop karena bug tersembunyi — `revalidatePath`
 * tidak menjangkau cache module di lambda yang masih hangat, sehingga visitor
 * lihat data stale sampai TTL habis. ISR + per-request dedup lebih konsisten
 * dan tidak butuh dance invalidation manual.
 */
export const loadHomepageData = cache(async (): Promise<HomepageData> => {
  return isD1Configured()
    ? await loadHomepageDataFromD1().catch((error) => {
        console.warn(
          '[HomepageLoader] D1 batch read failed, falling back to service loaders:',
          error
        );
        return loadHomepageDataFromServices();
      })
    : await loadHomepageDataFromServices();
});
