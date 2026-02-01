const fs = require('fs');

const files = [
    { name: 'HOME', path: './lighthouse-v3-home.json' },
    { name: 'ABOUT', path: './lighthouse-v3-about.json' }
];

console.log('\n========= HASIL LIGHTHOUSE V3 =========\n');

files.forEach(({ name, path }) => {
    try {
        if (!fs.existsSync(path)) {
            console.log(`[${name}] File tidak ditemukan`);
            return;
        }

        const data = JSON.parse(fs.readFileSync(path));
        const cats = data.categories;
        const audits = data.audits;

        console.log(`--- ${name} ---`);
        console.log(`  Performance:     ${Math.round(cats.performance.score * 100)}`);
        console.log(`  Accessibility:   ${Math.round(cats.accessibility.score * 100)}`);
        console.log(`  Best Practices:  ${Math.round(cats['best-practices'].score * 100)}`);
        console.log(`  SEO:             ${Math.round(cats.seo.score * 100)}`);
        console.log(`  ----`);
        console.log(`  LCP: ${audits['largest-contentful-paint'].displayValue}`);
        console.log(`  TBT: ${audits['total-blocking-time'].displayValue}`);
        console.log(`  CLS: ${audits['cumulative-layout-shift'].displayValue}`);

        // LCP Element
        if (audits['largest-contentful-paint-element']?.details?.items?.[0]?.node?.snippet) {
            console.log(`  LCP Element: ${audits['largest-contentful-paint-element'].details.items[0].node.snippet.substring(0, 80)}...`);
        }
        console.log('');
    } catch (e) {
        console.log(`[${name}] Error: ${e.message}`);
    }
});
