import { describe, it, expect } from 'vitest';

import {
  localizeText,
  localizeProject,
  localizeWorkflowSteps,
  localizeWorkExperience,
} from '../contentLocalization';
import type { Project } from '@/types/projects';
import type { WorkflowStep } from '@/types/about';
import type { WorkExperience } from '@/types/experience';

describe('contentLocalization', () => {
  describe('localizeText', () => {
    it('returns empty string for null/undefined', () => {
      expect(localizeText(null, 'en')).toBe('');
      expect(localizeText(undefined, 'en')).toBe('');
    });

    it('passes value through unchanged for locale id', () => {
      expect(localizeText('Motto kerja', 'id')).toBe('Motto kerja');
      expect(localizeText(null, 'id')).toBe('');
    });

    it('translates known keys to English', () => {
      expect(localizeText('PORTOFOLIO', 'en')).toBe('PORTFOLIO');
      expect(localizeText('8 bulan', 'en')).toBe('8 months');
      expect(localizeText('Motto kerja', 'en')).toBe('Work motto');
    });

    it('trims key before lookup', () => {
      expect(localizeText('  PORTOFOLIO  ', 'en')).toBe('PORTFOLIO');
    });

    it('falls back to original value for unknown keys', () => {
      expect(localizeText('teks tidak dikenal xyz', 'en')).toBe('teks tidak dikenal xyz');
    });

    it('handles the contact invitation special case', () => {
      expect(localizeText('Mau ngobrol soal kerja sama, proyek, atau apa pun? Tulis saja di sini.', 'en')).toBe(
        'Want to talk about collaboration, a project, or anything else? Write here and I will reply soon.'
      );
    });
  });

  describe('localizeProject', () => {
    const baseProject = {
      id: 'p1',
      title: 'PORTOFOLIO',
      description: 'Motto kerja',
      narrative: {
        context: 'Motto kerja',
        challenge: 'unknown challenge text',
      },
      galleryGroups: [{ name: 'PORTOFOLIO', description: 'Motto kerja', images: [] }],
    } as unknown as Project;

    it('returns same reference for locale id', () => {
      expect(localizeProject(baseProject, 'id')).toBe(baseProject);
    });

    it('localizes translatable fields and keeps unknown text as-is', () => {
      const result = localizeProject(baseProject, 'en');
      expect(result.title).toBe('PORTFOLIO');
      expect(result.description).toBe('Work motto');
      expect(result.narrative?.context).toBe('Work motto');
      expect(result.narrative?.challenge).toBe('unknown challenge text');
      expect(result.galleryGroups?.[0].name).toBe('PORTFOLIO');
      expect(result.id).toBe('p1');
    });
  });

  describe('localizeWorkflowSteps', () => {
    it('returns empty array for undefined steps', () => {
      expect(localizeWorkflowSteps(undefined, 'en')).toEqual([]);
      expect(localizeWorkflowSteps(undefined, 'id')).toEqual([]);
    });

    it('passes steps through for locale id', () => {
      const steps = [{ title: 'Briefing & Debrief' }] as unknown as WorkflowStep[];
      expect(localizeWorkflowSteps(steps, 'id')).toBe(steps);
    });

    it('localizes step and subStep fields', () => {
      const steps = [
        {
          title: 'Briefing & Debrief',
          subtitle: 'PORTOFOLIO',
          description: 'Motto kerja',
          subSteps: [{ title: 'PORTOFOLIO', description: '8 bulan' }],
        },
      ] as unknown as WorkflowStep[];
      const result = localizeWorkflowSteps(steps, 'en');
      expect(result[0].title).toBe('Briefing & Debrief');
      expect(result[0].subtitle).toBe('PORTFOLIO');
      expect(result[0].description).toBe('Work motto');
      expect(result[0].subSteps?.[0].title).toBe('PORTFOLIO');
      expect(result[0].subSteps?.[0].description).toBe('8 months');
    });
  });

  describe('localizeWorkExperience', () => {
    const job = {
      year: 'Agt 2016 - Mar 2017',
      duration: '8 bulan',
      position: 'Mentor Desain Grafis',
      description: ['Quality control produk sebelum dikirim.', 'teks asing xyz'],
    } as unknown as WorkExperience;

    it('returns same reference for locale id', () => {
      expect(localizeWorkExperience(job, 'id')).toBe(job);
    });

    it('localizes scalar fields and description array', () => {
      const result = localizeWorkExperience(job, 'en');
      expect(result.year).toBe('Aug 2016 - Mar 2017');
      expect(result.duration).toBe('8 months');
      expect(result.position).toBe('Graphic Design Mentor');
      expect(result.description).toEqual([
        'Quality-checked products before shipping.',
        'teks asing xyz',
      ]);
    });
  });
});
