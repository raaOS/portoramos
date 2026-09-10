import { describe, expect, it } from 'vitest';
import type { Project } from '@/types/projects';
import {
  collectProjectTranslationFields,
  getGalleryGroupTranslationKey,
  getTranslation,
} from './translations';

describe('project detail translation utilities', () => {
  it('collects visible project text without media or system fields', () => {
    const project = {
      id: 'p1',
      title: 'Judul Project',
      slug: 'judul-project',
      client: 'Brand Name',
      year: 2026,
      tags: ['motion'],
      cover: '/r2/assets/projects/video.mp4',
      autoplay: true,
      muted: true,
      loop: true,
      playsInline: true,
      coverWidth: 1080,
      coverHeight: 1920,
      description: 'Deskripsi project',
      narrative: {
        concept: 'Konsep visual',
        process: 'Proses produksi',
        detail: 'Detail hasil',
      },
      galleryGroups: [
        {
          id: 'group-a',
          name: 'Behind the Scene',
          description: 'Proses pembuatan',
          items: [],
        },
      ],
      order: 1,
      status: 'published',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
    } satisfies Project;

    expect(collectProjectTranslationFields(project)).toEqual({
      title: 'Judul Project',
      description: 'Deskripsi project',
      'narrative.concept': 'Konsep visual',
      'narrative.process': 'Proses produksi',
      'narrative.detail': 'Detail hasil',
      challenge: 'Konsep visual',
      solution: 'Proses produksi',
      impact: 'Detail hasil',
      'galleryGroups.group-a.name': 'Behind the Scene',
      'galleryGroups.group-a.description': 'Proses pembuatan',
    });
  });

  it('reads the first non-empty translation key', () => {
    expect(getTranslation({ primary: '', fallback: 'Translated' }, 'primary', 'fallback')).toBe(
      'Translated'
    );
  });

  it('builds stable gallery group translation keys', () => {
    expect(getGalleryGroupTranslationKey({ id: 'abc' }, 2, 'name')).toBe('galleryGroups.abc.name');
  });
});
