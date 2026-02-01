
const fs = require('fs');

const files = ['./lighthouse-home.json', './lighthouse-about.json'];
let outputBuffer = '';
function log(msg) { outputBuffer += msg + '\n'; }

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

files.forEach(file => {
    try {
        if (!fs.existsSync(file)) {
            console.log(`Skipping ${file} (not found)`);
            return;
        }
        const data = fs.readFileSync(file, 'utf8');
        const json = JSON.parse(data);
        const url = json.finalUrl;

        log(`\n========================================`);
        log(`REPORT FOR: ${url}`);
        log(`========================================`);

        // 1. Scores
        log(`\n--- SCORES ---`);
        ['performance', 'accessibility', 'best-practices', 'seo'].forEach(cat => {
            const score = json.categories[cat].score * 100;
            log(`${cat.padEnd(16)}: ${score}`);
        });

        // 2. Performance Metrics
        log(`\n--- PERFORMANCE METRICS ---`);
        const metrics = ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'];
        metrics.forEach(m => {
            const audit = json.audits[m];
            log(`${audit.title}: ${audit.displayValue} (Score: ${audit.score})`);
        });

        // 3. Failing Audits (Non-Performance)
        log(`\n--- FAILING AUDITS (A11y, SEO, BP) ---`);
        const catsToCheck = ['accessibility', 'best-practices', 'seo'];
        catsToCheck.forEach(catName => {
            const cat = json.categories[catName];
            cat.auditRefs.forEach(ref => {
                const audit = json.audits[ref.id];
                if (audit.score !== 1 && audit.score !== null) {
                    log(`[${catName}] ${audit.title} (Score: ${audit.score})`);
                    log(`   -> ${audit.description.split('.')[0]}.`);
                }
            });
        });

        // 4. Top Opportunities
        log(`\n--- OPPORTUNITIES ---`);
        const opportunities = Object.values(json.audits)
            .filter(audit => audit.details && audit.details.type === 'opportunity' && audit.score < 1)
            .sort((a, b) => (b.metricSavings?.LCP || 0) - (a.metricSavings?.LCP || 0));

        opportunities.forEach(op => {
            const savings = op.metricSavings ? `(LCP Savings: ${op.metricSavings.LCP}ms)` : '';
            const sizeSavings = op.details.overallSavingsBytes ? `Save ${formatBytes(op.details.overallSavingsBytes)}` : '';
            log(`- ${op.title}: ${op.displayValue} ${savings} ${sizeSavings}`);
        });

    } catch (e) {
        console.error(`Error processing ${file}:`, e);
    }
});

fs.writeFileSync('analysis_output.txt', outputBuffer);
console.log('Analysis written to analysis_output.txt');
