import { describe, it, expect, vi } from 'vitest';
import { generateSitemap } from '../seo';

describe('SEO Utilities', () => {
  it('generateSitemap should include corrected project and homepage links', () => {
    // Set env var for test using vi.stubEnv
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://raa.is');

    const sitemap = generateSitemap([]);
    console.log('SITEMAP OUTPUT:', sitemap);

    // Result should contain the expected site URL and routes
    expect(sitemap).toContain('https://raa.is');
    expect(sitemap).toContain('/projects');
    // Restore env
    vi.unstubAllEnvs();
  });
});
