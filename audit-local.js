
const fs = require('fs');
['./lighthouse-home-local.json', './lighthouse-about-local.json'].forEach(f => {
    try {
        if (!fs.existsSync(f)) return;
        const d = JSON.parse(fs.readFileSync(f));
        console.log(`\nURL: ${d.finalUrl}`);
        const errs = d.audits['errors-in-console'];
        if (errs && errs.score !== 1) {
            console.log('CONSOLE ERRORS:');
            errs.details?.items?.forEach(i => console.log(` - ${i.description}`));
        }
        const a11y = d.categories.accessibility;
        console.log(`A11y Score: ${a11y.score * 100}`);
        a11y.auditRefs.forEach(r => {
            const a = d.audits[r.id];
            if (a.score !== 1 && a.score !== null) console.log(` - [A11y] ${a.title}`);
        });
    } catch (e) { }
});
