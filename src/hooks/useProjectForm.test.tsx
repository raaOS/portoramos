import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useProjectForm } from './useProjectForm';
import type { Project } from '@/types/projects';

function createProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'project-1',
    title: 'Existing Project',
    slug: 'existing-project',
    client: 'Client',
    year: 2026,
    tags: ['branding'],
    cover: '/r2/assets/projects/cover.jpg',
    autoplay: true,
    muted: true,
    loop: true,
    playsInline: true,
    coverWidth: 1200,
    coverHeight: 800,
    description: 'Existing project description',
    order: 1,
    status: 'published',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  };
}

describe('useProjectForm', () => {
  it('hydrates flat gallery items when editing an existing project', () => {
    const project = createProject({
      galleryItems: [
        { kind: 'image', src: '/r2/assets/projects/item-a.jpg', isActive: false },
        { kind: 'video', src: '/r2/assets/projects/item-b.mp4' },
      ],
    });

    const { result } = renderHook(() => useProjectForm(project));

    expect(result.current.formData.galleryItems).toEqual([
      { kind: 'image', src: '/r2/assets/projects/item-a.jpg', isActive: false },
      { kind: 'video', src: '/r2/assets/projects/item-b.mp4', isActive: true },
    ]);

    let submitData: ReturnType<typeof result.current.getSubmitData> = null;
    act(() => {
      submitData = result.current.getSubmitData();
    });
    if (!submitData) throw new Error('Expected submit data');
    const data = submitData as NonNullable<ReturnType<typeof result.current.getSubmitData>>;

    expect(data.gallery).toEqual([
      '/r2/assets/projects/item-a.jpg',
      '/r2/assets/projects/item-b.mp4',
    ]);
    expect(data.galleryItems).toEqual(result.current.formData.galleryItems);
  });

  it('converts legacy gallery URLs into editable gallery items', () => {
    const project = createProject({
      gallery: ['/r2/assets/projects/legacy-a.jpg', '/r2/assets/projects/legacy-b.mp4'],
    });

    const { result } = renderHook(() => useProjectForm(project));

    expect(result.current.formData.galleryItems).toEqual([
      { kind: 'image', src: '/r2/assets/projects/legacy-a.jpg', isActive: true },
      { kind: 'video', src: '/r2/assets/projects/legacy-b.mp4', isActive: true },
    ]);

    let submitData: ReturnType<typeof result.current.getSubmitData> = null;
    act(() => {
      submitData = result.current.getSubmitData();
    });
    if (!submitData) throw new Error('Expected submit data');
    const data = submitData as NonNullable<ReturnType<typeof result.current.getSubmitData>>;

    expect(data.gallery).toEqual([
      '/r2/assets/projects/legacy-a.jpg',
      '/r2/assets/projects/legacy-b.mp4',
    ]);
  });
});
