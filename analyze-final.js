
const fs = require('fs');
['./lighthouse-home-final.json', './lighthouse-about-final.json'].forEach(f => {
    try {
        if (!fs.existsSync(f)) return;
        const d = JSON.parse(fs.readFileSync(f));
        console.log(`\nReport: ${d.finalUrl}`);
        ['performance', 'accessibility', 'best-practices', 'seo'].forEach(c =>
            console.log(`${c}: ${d.categories[c].score * 100}`));

        // Perf metrics
        if (d.categories.performance) {
            console.log(`LCP: ${d.audits['largest-contentful-paint'].displayValue}`);
            console.log(`TBT: ${d.audits['total-blocking-time'].displayValue}`);
            console.log(`CLS: ${d.audits['cumulative-layout-shift'].displayValue}`);
        }
    } catch (e) { console.log(e.message); }
});
