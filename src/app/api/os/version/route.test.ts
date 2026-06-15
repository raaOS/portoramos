import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/constants', () => ({
  APP_VERSION: '0.1.0',
}));

import { GET } from './route';

describe('GET /api/os/version', () => {
  it('returns the current app version and timestamp', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.version).toBe('0.1.0');
    expect(typeof body.timestamp).toBe('number');
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });
});
