import { describe, it, expect } from 'vitest';
import {
  hardSkillSchema,
  bulkUpdateHardSkillsSchema,
  updateHardSkillSchema,
  stickyNoteSchema,
  stickyNotesBulkSchema,
  galleryFeaturedSchema,
  updateDesignPhilosophySchema,
  createHardSkillConceptSchema,
  updateHardSkillConceptSchema,
  updateAboutSchema,
} from '../adminCrud';

describe('hardSkillSchema', () => {
  const validSkill = {
    id: 'skill-1',
    name: 'Photoshop',
    iconUrl: 'https://example.com/icon.png',
    level: 'Advanced' as const,
    order: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  it('accepts valid skill', () => {
    expect(hardSkillSchema.safeParse(validSkill).success).toBe(true);
  });

  it('rejects invalid level enum', () => {
    const result = hardSkillSchema.safeParse({ ...validSkill, level: 'Guru' });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = hardSkillSchema.safeParse({ ...validSkill, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects negative order', () => {
    const result = hardSkillSchema.safeParse({ ...validSkill, order: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects unknown fields (strict)', () => {
    const result = hardSkillSchema.safeParse({
      ...validSkill,
      unknownField: 'hack',
    });
    expect(result.success).toBe(false);
  });
});

describe('bulkUpdateHardSkillsSchema', () => {
  it('accepts empty array', () => {
    expect(bulkUpdateHardSkillsSchema.safeParse([]).success).toBe(true);
  });

  it('rejects non-array', () => {
    expect(bulkUpdateHardSkillsSchema.safeParse({ skills: [] }).success).toBe(false);
  });

  it('caps array size at 200', () => {
    const huge = Array.from({ length: 201 }, (_, i) => ({
      id: `skill-${i}`,
      name: 'X',
      iconUrl: 'x',
      level: 'Beginner' as const,
      order: i,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }));
    expect(bulkUpdateHardSkillsSchema.safeParse(huge).success).toBe(false);
  });
});

describe('updateHardSkillSchema', () => {
  it('rejects attempt to override id via body', () => {
    // id & createdAt di-omit dari updateHardSkillSchema
    const result = updateHardSkillSchema.safeParse({
      id: 'forged-id',
      name: 'Updated',
    });
    expect(result.success).toBe(false);
  });

  it('requires at least one field', () => {
    const result = updateHardSkillSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts single field update', () => {
    const result = updateHardSkillSchema.safeParse({ name: 'Renamed' });
    expect(result.success).toBe(true);
  });
});

describe('stickyNoteSchema', () => {
  const validNote = {
    id: 'note-1',
    text: 'Hello',
    date: '2025-01-01T00:00:00Z',
    color: '#fef08a',
    isStarred: false,
    isDeleted: false,
  };

  it('accepts minimal valid note', () => {
    expect(stickyNoteSchema.safeParse(validNote).success).toBe(true);
  });

  it('caps text length at 5000', () => {
    const huge = { ...validNote, text: 'x'.repeat(5001) };
    expect(stickyNoteSchema.safeParse(huge).success).toBe(false);
  });

  it('rejects unknown fields', () => {
    const result = stickyNoteSchema.safeParse({ ...validNote, evil: 'xss' });
    expect(result.success).toBe(false);
  });

  it('accepts percentage positioning', () => {
    const result = stickyNoteSchema.safeParse({
      ...validNote,
      xPct: 50,
      yPct: 60,
      widthPct: 30,
      heightPct: 40,
    });
    expect(result.success).toBe(true);
  });

  it('bounds opacity 0..1', () => {
    expect(stickyNoteSchema.safeParse({ ...validNote, opacity: 1.5 }).success).toBe(false);
    expect(stickyNoteSchema.safeParse({ ...validNote, opacity: 0.5 }).success).toBe(true);
  });
});

describe('stickyNotesBulkSchema', () => {
  it('caps array at 200 notes', () => {
    const huge = Array.from({ length: 201 }, (_, i) => ({
      id: `note-${i}`,
      text: '',
      date: '2025-01-01',
      color: '#fff',
      isStarred: false,
      isDeleted: false,
    }));
    expect(stickyNotesBulkSchema.safeParse(huge).success).toBe(false);
  });
});

describe('galleryFeaturedSchema', () => {
  it('accepts valid list', () => {
    const result = galleryFeaturedSchema.safeParse({
      featuredProjectIds: ['id-1', 'id-2'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty string id', () => {
    const result = galleryFeaturedSchema.safeParse({
      featuredProjectIds: ['', 'valid'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing featuredProjectIds key', () => {
    expect(galleryFeaturedSchema.safeParse({}).success).toBe(false);
  });

  it('caps list at 100 items', () => {
    const huge = { featuredProjectIds: Array.from({ length: 101 }, (_, i) => `id-${i}`) };
    expect(galleryFeaturedSchema.safeParse(huge).success).toBe(false);
  });
});

describe('updateDesignPhilosophySchema', () => {
  it('requires heading, subheading, dan workflowSteps', () => {
    expect(updateDesignPhilosophySchema.safeParse({}).success).toBe(false);
  });

  it('accepts valid payload', () => {
    const payload = {
      heading: 'Design Philosophy',
      subheading: 'Approach',
      workflowSteps: [
        {
          id: 'step-1',
          number: '01',
          title: 'Research',
          subtitle: 'Deep dive',
          description: 'We start with research.',
          type: 'phase' as const,
          color: 'amber' as const,
          icon: 'search',
          subSteps: [],
          nextSteps: ['step-2'],
          loopTargets: [],
        },
      ],
    };
    expect(updateDesignPhilosophySchema.safeParse(payload).success).toBe(true);
  });

  it('rejects workflowSteps with invalid type enum', () => {
    const payload = {
      heading: 'H',
      subheading: 'S',
      workflowSteps: [
        {
          id: 'step-1',
          number: '01',
          title: 'T',
          subtitle: 'St',
          description: 'D',
          type: 'invalid-type',
          color: 'amber' as const,
          icon: 'x',
          subSteps: [],
          nextSteps: [],
          loopTargets: [],
        },
      ],
    };
    expect(updateDesignPhilosophySchema.safeParse(payload).success).toBe(false);
  });
});

describe('hardSkillConceptSchemas', () => {
  it('createHardSkillConceptSchema requires title + description', () => {
    expect(
      createHardSkillConceptSchema.safeParse({
        title: 'UI',
        description: 'User interface design',
      }).success
    ).toBe(true);
    expect(createHardSkillConceptSchema.safeParse({ title: 'UI' }).success).toBe(false);
  });

  it('updateHardSkillConceptSchema requires at least one field', () => {
    expect(updateHardSkillConceptSchema.safeParse({}).success).toBe(false);
    expect(updateHardSkillConceptSchema.safeParse({ title: 'New' }).success).toBe(true);
  });
});

describe('updateAboutSchema layout preferences', () => {
  it('accepts persisted zIndex for desktop icons/windows and icon size', () => {
    const result = updateAboutSchema.safeParse({
      desktopPreferences: {
        iconPositions: {
          'project-a': {
            x: 120,
            y: 160,
            zIndex: 420,
            size: 'large',
            xPct: 10,
            yPct: 20,
            refScreenWidth: 1200,
            refScreenHeight: 800,
          },
        },
      },
      windowPreferences: {
        about: {
          x: 100,
          y: 80,
          width: 900,
          height: 600,
          zIndex: 430,
          isOpenByDefault: true,
        },
      },
    });

    expect(result.success).toBe(true);
  });
});
