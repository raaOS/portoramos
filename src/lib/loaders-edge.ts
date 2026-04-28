import { fetchFromFirebase } from './firebase/edge-fetch';
import type { AboutData } from '@/types/about';
import type { Project, ProjectsData } from '@/types/projects';
import type { TestimonialData } from '@/types/testimonial';
import type { ExperienceData } from '@/types/experience';
import type { HardSkillsData } from '@/types/hardSkill';

// Fallback data imports
import aboutFallback from '@/data/about.json';
import experienceFallback from '@/data/experience.json';
import hardSkillsFallback from '@/data/hardSkills.json';
import projectsFallback from '@/data/projects.json';
import testimonialFallback from '@/data/testimonial.json';

/**
 * Simple deep merge for Edge runtime.
 * Merges Firebase data over fallback data.
 */
function deepMerge<T>(base: T, override: unknown): T {
    if (!override || typeof override !== 'object' || Array.isArray(override)) return override as T;
    if (!base) return override as T;

    const result = { ...(base as Record<string, unknown>) };
    const overrideObj = override as Record<string, unknown>;
    
    for (const key of Object.keys(overrideObj)) {
        result[key] = deepMerge(result[key], overrideObj[key]);
    }
    return result as T;
}

export async function loadAboutDataEdge(): Promise<AboutData> {
    const data = await fetchFromFirebase<AboutData>('content/about');
    return deepMerge(aboutFallback as AboutData, data);
}

export async function loadExperienceDataEdge(): Promise<ExperienceData> {
    const data = await fetchFromFirebase<ExperienceData>('content/experience');
    return (data || experienceFallback) as ExperienceData;
}

export async function loadHardSkillsDataEdge(): Promise<HardSkillsData> {
    const data = await fetchFromFirebase<HardSkillsData>('content/hard-skills');
    return data || (hardSkillsFallback as HardSkillsData);
}

export async function loadProjectsDataEdge(): Promise<Project[]> {
    const data = await fetchFromFirebase<ProjectsData>('content/projects');
    const projects = (data?.projects || (projectsFallback as ProjectsData).projects) as Project[];
    
    return (projects || [])
        .filter(p => p.status !== 'draft')
        .sort((a, b) => (a.order || 0) - (b.order || 0) || (b.year || 0) - (a.year || 0));
}

export async function loadTestimonialsDataEdge(): Promise<TestimonialData> {
    const data = await fetchFromFirebase<TestimonialData>('content/testimonial');
    return (data || testimonialFallback) as TestimonialData;
}
