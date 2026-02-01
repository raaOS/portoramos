const fs = require('fs');

const files = [
    { name: 'HOME', path: './lighthouse-final-home.json' },
    { name: 'ABOUT', path: './lighthouse-final-about.json' }
];

console.log('\n=== HASIL LIGHTHOUSE FINAL ===\n');

files.forEach(({ name, path }) => {
    try {
        if (!fs.existsSync(path)) {
            console.log(`[${name}] File tidak ditemukan: ${path}`);
            return;
        }

        const data = JSON.parse(fs.readFileSync(path));
        const cats = data.categories;

        console.log(`--- ${name} (${data.finalUrl}) ---`);
        console.log(`  Performance:     ${Math.round(cats.performance.score * 100)}`);
        console.log(`  Accessibility:   ${Math.round(cats.accessibility.score * 100)}`);
        console.log(`  Best Practices:  ${Math.round(cats['best-practices'].score * 100)}`);
        console.log(`  SEO:             ${Math.round(cats.seo.score * 100)}`);

        // Metrics detail
        const audits = data.audits;
        console.log(`  ---`);
        console.log(`  LCP: ${audits['largest-contentful-paint'].displayValue || 'N/A'}`);
        console.log(`  TBT: ${audits['total-blocking-time'].displayValue || 'N/A'}`);
        console.log(`  CLS: ${audits['cumulative-layout-shift'].displayValue || 'N/A'}`);
        console.log('');
    } catch (e) {
        console.log(`[${name}] Error: ${e.message}`);
    }
});
