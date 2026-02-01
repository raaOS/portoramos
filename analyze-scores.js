
const fs = require('fs');

const files = ['lighthouse-home.json', 'lighthouse-about.json'];
let output = '';

files.forEach(file => {
    try {
        const data = fs.readFileSync(file, 'utf8');
        const json = JSON.parse(data);
        output += `\n--- Report for ${json.finalUrl} ---\n`;
        output += `Performance: ${json.categories.performance.score * 100}\n`;
        output += `Accessibility: ${json.categories.accessibility.score * 100}\n`;
        output += `Best Practices: ${json.categories['best-practices'].score * 100}\n`;
        output += `SEO: ${json.categories.seo.score * 100}\n`;

        // Check for high impact audits in performance
        output += '\nTop Improvement Opportunities:\n';
        const opportunities = Object.values(json.audits)
            .filter(audit => audit.details && audit.details.type === 'opportunity' && (audit.score === null || audit.score < 0.9))
            .sort((a, b) => (b.metricSavings?.LCP || 0) - (a.metricSavings?.LCP || 0))
            .slice(0, 5);

        opportunities.forEach(op => {
            output += `- ${op.title}: ${op.displayValue}\n`;
        });

    } catch (e) {
        output += `Error reading ${file}: ${e.message}\n`;
    }
});

fs.writeFileSync('scores.txt', output);
console.log('Scores written to scores.txt');
