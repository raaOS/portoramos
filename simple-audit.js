
const fs = require('fs');

const files = ['./lighthouse-home.json', './lighthouse-about.json'];

files.forEach(file => {
    try {
        if (!fs.existsSync(file)) return;
        const data = fs.readFileSync(file, 'utf8');
        const json = JSON.parse(data);
        const url = json.finalUrl;

        console.log(`\nREPORT: ${url}`);

        ['accessibility', 'best-practices', 'seo'].forEach(catName => {
            const cat = json.categories[catName];
            console.log(`Category: ${catName} (${cat.score * 100})`);
            cat.auditRefs.forEach(ref => {
                const audit = json.audits[ref.id];
                if (audit.score !== 1 && audit.score !== null) {
                    // Clean string to avoid weird chars
                    const title = audit.title.replace(/[^\x00-\x7F]/g, " ");
                    console.log(`  [FAIL] ${title} (Found: ${audit.displayValue || 'N/A'})`);
                }
            });
        });

    } catch (e) {
        console.log(e.message);
    }
});
