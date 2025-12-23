const fs = require('fs');

try {
    const data = fs.readFileSync('lighthouse-debug.json', 'utf8');
    const report = JSON.parse(data);

    const categories = report.categories;
    console.log('--- SCORES ---');
    console.log('Performance:', categories.performance.score * 100);
    console.log('Accessibility:', categories.accessibility.score * 100);
    console.log('Best Practices:', categories['best-practices'].score * 100);
    console.log('SEO:', categories.seo.score * 100);

    console.log('\n--- PERFORMANCE ISSUES ---');
    const perfAudits = report.categories.performance.auditRefs;
    perfAudits.forEach(ref => {
        const audit = report.audits[ref.id];
        if (audit.score !== null && audit.score < 0.9) {
            console.log(`[${audit.id}] ${audit.title}: ${audit.displayValue || audit.score}`);
        }
    });

    console.log('\n--- BEST PRACTICES ISSUES ---');
    const bpAudits = report.categories['best-practices'].auditRefs;
    bpAudits.forEach(ref => {
        const audit = report.audits[ref.id];
        if (audit.score !== null && audit.score < 1) {
            console.log(`[${audit.id}] ${audit.title}`);
        }
    });

    console.log('\n--- SEO ISSUES ---');
    const seoAudits = report.categories.seo.auditRefs;
    seoAudits.forEach(ref => {
        const audit = report.audits[ref.id];
        if (audit.score !== null && audit.score < 1) {
            console.log(`[${audit.id}] ${audit.title}`);
        }
    });

} catch (err) {
    console.error('Error parsing report:', err);
}
