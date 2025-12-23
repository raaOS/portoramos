const fs = require('fs');

try {
    const data = fs.readFileSync('lighthouse-report.json', 'utf8');
    const report = JSON.parse(data);
    const categories = report.categories;

    console.log('Performance:', categories.performance.score * 100);
    console.log('Accessibility:', categories.accessibility.score * 100);
    console.log('Best Practices:', categories['best-practices'].score * 100);
    console.log('SEO:', categories.seo.score * 100);

} catch (err) {
    console.error('Error parsing report:', err);
}
