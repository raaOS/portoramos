import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Project } from '@/types/projects';

function createProject(): Project {
  return {
    id: 'a',
    title: 'Project A',
    slug: 'project-a',
    client: 'Client',
    year: 2025,
    tags: ['design'],
    cover: '/image.jpg',
    autoplay: false,
    muted: true,
    loop: false,
    playsInline: true,
    coverWidth: 1200,
    coverHeight: 800,
    description: 'Description',
    order: 1,
    status: 'published',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe('Projects3DView', () => {
  it('merender canvas ketika komponen inti berhasil dimuat', async () => {
    vi.doMock('../InfiniteCanvasView', () => ({
      default: () => <div data-testid="canvas-3d">Canvas Loaded</div>,
    }));

    const module = await import('../Projects3DView');
    render(<module.default projects={[createProject()]} />);

    expect(await screen.findByTestId('canvas-3d')).toBeInTheDocument();
  });

  it('menampilkan fallback ketika komponen inti melempar error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.doMock('../InfiniteCanvasView', () => ({
      default: () => {
        throw new Error('3D crash');
      },
    }));

    const module = await import('../Projects3DView');
    render(<module.default projects={[createProject()]} />);

    expect(await screen.findByText('Mode 3D gagal dimuat')).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });
});
