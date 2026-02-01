
const fs = require('fs');
['./lighthouse-home-v2.json', './lighthouse-about-v2.json'].forEach(f => {
    try {
        const d = JSON.parse(fs.readFileSync(f));
        console.log(d.finalUrl);
        ['performance', 'accessibility', 'best-practices', 'seo'].forEach(c =>
            console.log(`${c}: ${d.categories[c].score * 100}`));
    } catch (e) { }
});
