const https = require('https');
const fs = require('fs');
const path = require('path');

// Parse .env.local manually
let apiKey = '';
try {
    const envPath = path.resolve('.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GOOGLE_PAGESPEED_API_KEY=(.*)/);
    if (match) apiKey = match[1].trim();
} catch (e) {
    console.log('Error reading env:', e.message);
}

const url = 'https://portfolio-shared-9kyi1aa1q-raaos-projects.vercel.app';
const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=PERFORMANCE&novache=${Date.now()}${apiKey ? `&key=${apiKey}` : ''}`;

console.log('Diagnosing:', url);

https.get(apiUrl, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error('API Error:', json.error.message);
                return;
            }

            const audits = json.lighthouseResult.audits;
            const categories = json.lighthouseResult.categories;

            let output = '';
            output += '\n--- SCORE ---\n';
            output += `Performance: ${categories.performance.score * 100}\n`;

            output += '\n--- METRICS ---\n';
            output += `LCP: ${audits['largest-contentful-paint'].displayValue}\n`;
            output += `FCP: ${audits['first-contentful-paint'].displayValue}\n`;
            output += `CLS: ${audits['cumulative-layout-shift'].displayValue}\n`;
            output += `TBT: ${audits['total-blocking-time'].displayValue}\n`;
            output += `Speed Index: ${audits['speed-index'].displayValue}\n`;

            output += '\n--- TOP OPPORTUNITIES ---\n';
            const opportunities = Object.values(audits)
                .filter(audit => audit.details && audit.details.type === 'opportunity' && audit.score < 0.9)
                .sort((a, b) => (b.details.overallSavingsMs || 0) - (a.details.overallSavingsMs || 0))
                .slice(0, 5);

            opportunities.forEach(op => {
                output += `[${op.id}] ${op.title}\n`;
                output += `   Savings: ${(op.details.overallSavingsMs || 0).toFixed(0)}ms\n`;
                output += `   Description: ${op.description.split('[')[0].trim()}\n`;
            });

            output += '\n--- DIAGNOSTICS ---\n';
            const diagnostics = Object.values(audits)
                .filter(audit => audit.scoreDisplayMode === 'error' || (audit.score !== null && audit.score < 0.5))
                .filter(audit => !audit.details || audit.details.type !== 'opportunity')
                .slice(0, 5);

            diagnostics.forEach(diag => {
                output += `[${diag.id}] ${diag.title}\n`;
            });

            // Redirects Details
            const redirectsAudit = audits['redirects'];
            if (redirectsAudit && redirectsAudit.details) {
                output += '\n--- REDIRECTS ---\n';
                output += JSON.stringify(redirectsAudit.details, null, 2);
            }

            // Specific LCP Breakdown
            const lcpAudit = audits['largest-contentful-paint'];
            if (lcpAudit && lcpAudit.details) {
                output += '\n--- LCP BREAKDOWN ---\n';
                output += JSON.stringify(lcpAudit.details, null, 2);
            }

            // Also get the element causing LCP
            const lcpElement = audits['largest-contentful-paint-element'];
            if (lcpElement && lcpElement.details) {
                output += '\n--- LCP ELEMENT ---\n';
                output += JSON.stringify(lcpElement.details, null, 2);
            }

            fs.writeFileSync('diagnosis.txt', output);
            console.log('Diagnosis saved to diagnosis.txt');

        } catch (e) {
            console.error('Parse Error', e);
        }
    });
}).on('error', (e) => {
    console.error('Request Error', e);
});
