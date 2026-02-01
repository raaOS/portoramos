
const fs = require('fs');
['lighthouse-home-local.json', 'lighthouse-about-local.json'].forEach(f => {
    if (fs.existsSync(f)) {
        const d = JSON.parse(fs.readFileSync(f));
        console.log(`\n--- ${d.finalUrl} ---`);

        // Console Errors
        const errs = d.audits['errors-in-console'];
        if (errs && errs.score !== 1) {
            console.log('ERRORS:');
            errs.details?.items?.forEach(i => console.log(` [${i.source}] ${i.description}`));
        }

        // A11y Failures
        const a11y = d.categories.accessibility;
        console.log(`A11y Score: ${a11y.score * 100}`);
        a11y.auditRefs.forEach(r => {
            const a = d.audits[r.id];
            if (a.score !== 1 && a.score !== null) {
                console.log(` [FAIL] ${a.title}`);
                a.details?.items?.forEach(i => console.log(`   > ${i.node?.snippet || i.node?.selector}`));
            }
        });

        // Performance Failures (Opportunities)
        console.log(`Perf Opportunities:`);
        Object.values(d.audits).forEach(a => {
            if (a.details?.type === 'opportunity' && a.score < 1) {
                console.log(` [${a.score}] ${a.title}`);
            }
        });
    }
});
