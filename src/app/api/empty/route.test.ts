import { describe, expect, it } from 'vitest';
import { GET, POST, HEAD } from './route';

describe('GET /api/empty', () => {
  it('returns 204 No Content', async () => {
    const response = await GET();
    expect(response.status).toBe(204);
  });
});

describe('POST /api/empty', () => {
  it('returns 204 No Content', async () => {
    const response = await POST();
    expect(response.status).toBe(204);
  });
});

describe('HEAD /api/empty', () => {
  it('returns 204 No Content', async () => {
    const response = await HEAD();
    expect(response.status).toBe(204);
  });
});
