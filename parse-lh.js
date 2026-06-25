const r = require('./lighthouse-report.json');
const lcpAudit = r.audits['largest-contentful-paint-element'];
if (lcpAudit && lcpAudit.details && lcpAudit.details.items) {
  console.log('LCP Element Details:');
  console.dir(lcpAudit.details.items[0], { depth: null });
} else {
  console.log('No LCP element details found.');
}
