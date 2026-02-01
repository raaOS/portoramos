
const fs = require('fs');
const files = ['./lighthouse-home.json'];

files.forEach(file => {
    try {
        if (!fs.existsSync(file)) return;
        const json = JSON.parse(fs.readFileSync(file, 'utf8'));

        const contrastAudit = json.audits['color-contrast'];
        if (contrastAudit && contrastAudit.score !== 1) {
            console.log('CONTRAST ISSUES:');
            contrastAudit.details.items.forEach(item => {
                console.log(`- Element: ${item.node.snippet}`);
                console.log(`  Selector: ${item.node.selector}`);
            });
        }

        const errorsAudit = json.audits['errors-in-console'];
        if (errorsAudit && errorsAudit.score !== 1) {
            console.log('\nCONSOLE ERRORS:');
            errorsAudit.details.items.forEach(item => {
                console.log(`- ${item.source}: ${item.description}`);
            });
        }

    } catch (e) { console.log(e.message); }
});
