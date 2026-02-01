
const fs = require('fs');

const files = ['./lighthouse-home-v2.json', './lighthouse-about-v2.json'];

files.forEach(file => {
    try {
        if (!fs.existsSync(file)) {
            console.log(`Skipping ${file}`);
            return;
        }
        const data = fs.readFileSync(file, 'utf8');
        const json = JSON.parse(data);
        const url = json.finalUrl;

        console.log(`\nResults for: ${url}`);

        // Scores
        ['performance', 'accessibility', 'best-practices', 'seo'].forEach(cat => {
            const score = json.categories[cat].score * 100;
            console.log(`${cat.padEnd(16)}: ${score}`);
        });

        // Failures (< 100 score) only
        console.log(`Failures:`);
        Object.values(json.audits).forEach(audit => {
            if (audit.score !== null && audit.score < 1) { // Strict 100 check (score 1)
                // Only show if it matters
                if (audit.details?.type === 'opportunity' || audit.scoreDisplayMode === 'binary') {
                    console.log(`  - [${audit.score}] ${audit.title} (${audit.displayValue || ''})`);
                }
            }
        });

    } catch (e) {
        console.log(e.message);
    }
});
