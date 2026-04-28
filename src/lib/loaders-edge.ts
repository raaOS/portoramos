import { fetchFromFirebase } from './firebase/edge-fetch';
import type { AboutData } from '@/types/about';
import type { Project, ProjectsData } from '@/types/projects';
import type { TestimonialData } from '@/types/testimonial';
import type { ExperienceData } from '@/types/experience';

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
function deepMerge(base: any, override: any): any {
    if (!override) return base;
    if (!base) return override;
    if (typeof override !== 'object' || Array.isArray(override)) return override;

    const result = { ...base };
    for (const key of Object.keys(override)) {
        result[key] = deepMerge(base[key], override[key]);
    }
    return result;
}

export async function loadAboutDataEdge(): Promise<AboutData> {
    const data = await fetchFromFirebase<AboutData>('content/about');
    return deepMerge(aboutFallback, data) as AboutData;
}

export async function loadExperienceDataEdge(): Promise<ExperienceData> {
    const data = await fetchFromFirebase<ExperienceData>('content/experience');
    return (data || experienceFallback) as ExperienceData;
}

export async function loadHardSkillsDataEdge(): Promise<any> {
    const data = await fetchFromFirebase<any>('content/hard-skills');
    return data || hardSkillsFallback;
}

export async function loadProjectsDataEdge(): Promise<Project[]> {
    const data = await fetchFromFirebase<ProjectsData>('content/projects');
    const projects = (data?.projects || (projectsFallback as any).projects) as Project[];
    
    return (projects || [])
        .filter(p => p.status !== 'draft')
        .sort((a, b) => (a.order || 0) - (b.order || 0) || (b.year || 0) - (a.year || 0));
}

export async function loadTestimonialsDataEdge(): Promise<TestimonialData> {
    const data = await fetchFromFirebase<TestimonialData>('content/testimonial');
    return (data || testimonialFallback) as TestimonialData;
}
