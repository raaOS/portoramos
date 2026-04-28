import { aboutService } from './services/aboutService';
import { projectService } from './services/projectService';
import { experienceService } from './services/experienceService';
import { hardSkillService } from './services/hardSkillService';
import { testimonialService } from './services/testimonialService';

/**
 * Consolidates homepage data fetching into a single call.
 * Uses Node-based services with internal caching.
 */
export async function loadHomepageData() {
  // Fetch everything in parallel using Node services
  const [aboutData, projectsResult, experienceData, hardSkillsData, testimonialsData] = await Promise.all([
    aboutService.getAboutData(),
    projectService.getProjects(),
    experienceService.getExperienceData(),
    hardSkillService.getHardSkills(),
    testimonialService.getTestimonials(),
  ]);

  return {
    aboutData,
    projects: (projectsResult.projects || []).filter(p => p.status !== 'draft'),
    experienceData,
    hardSkillsData,
    testimonialsData,
  };
}
