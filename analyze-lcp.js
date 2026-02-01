
const fs = require('fs');
const file = './lighthouse-home-local.json';

try {
    const data = fs.readFileSync(file, 'utf8');
    const json = JSON.parse(data);

    console.log('--- LCP Analysis ---');
    const lcpAudit = json.audits['largest-contentful-paint-element'];
    if (lcpAudit && lcpAudit.details && lcpAudit.details.items) {
        lcpAudit.details.items.forEach(item => {
            console.log('LCP Element:', item.node.snippet);
            console.log('Selector:', item.node.selector);
        });
    }

    console.log('\n--- Main Thread Breakdown ---');
    const mainThread = json.audits['mainthread-work-breakdown'];
    if (mainThread && mainThread.details && mainThread.details.items) {
        mainThread.details.items.slice(0, 5).forEach(item => {
            console.log(`${item.group}: ${item.duration}ms`);
        });
    }

    console.log('\n--- Network Requests (Top 5 largest) ---');
    const network = json.audits['network-requests'];
    if (network && network.details && network.details.items) {
        network.details.items
            .sort((a, b) => b.resourceSize - a.resourceSize)
            .slice(0, 5)
            .forEach(item => {
                console.log(`${item.url.split('/').pop()} (${Math.round(item.resourceSize / 1024)} KB)`);
            });
    }

} catch (e) { console.log(e.message); }
