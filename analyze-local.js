
const fs = require('fs');
['./lighthouse-home-local.json', './lighthouse-about-local.json'].forEach(f => {
    try {
        if (!fs.existsSync(f)) { console.log(`${f} not found`); return; }
        const d = JSON.parse(fs.readFileSync(f));
        console.log(`\nReport: ${d.finalUrl}`);
        ['performance', 'accessibility', 'best-practices', 'seo'].forEach(c =>
            console.log(`${c}: ${d.categories[c].score * 100}`));

        console.log(`Failures:`);
        Object.values(d.audits).forEach(audit => {
            if (audit.score !== null && audit.score < 1) {
                if (audit.details?.type === 'opportunity' || audit.scoreDisplayMode === 'binary') {
                    console.log(`  - [${audit.score}] ${audit.title} (${audit.displayValue || ''})`);
                }
            }
        });
    } catch (e) { console.log(e.message); }
});
