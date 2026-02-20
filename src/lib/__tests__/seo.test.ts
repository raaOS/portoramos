import { describe, it, expect } from 'vitest';
import { generateSitemap } from '../seo';

describe('SEO Utilities', () => {
    it('generateSitemap should include corrected project and homepage links', () => {
        // Set env var for test
        process.env.NEXT_PUBLIC_SITE_URL = 'https://raa.is';

        const sitemap = generateSitemap([]);
        console.log('SITEMAP OUTPUT:', sitemap);

        // Result should contain the expected site URL and routes
        expect(sitemap).toContain('https://raa.is');
        expect(sitemap).toContain('/projects');
        expect(sitemap).not.toContain('/works');
    });
});
