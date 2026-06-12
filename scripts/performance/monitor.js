#!/usr/bin/env node

/**
 * Performance Monitoring Script
 * Mengukur Core Web Vitals menggunakan Lighthouse CLI secara programatis.
 *
 * Sebelumnya script ini menggunakan browser-only APIs (window, PerformanceObserver)
 * yang TIDAK berjalan di Node.js. Sekarang menggunakan Lighthouse untuk pengukuran
 * yang akurat dari CLI.
 *
 * Prasyarat:
 *   npm install -g lighthouse   ATAU   npx lighthouse --version
 *
 * Penggunaan:
 *   node scripts/performance/monitor.js [url]
 *   node scripts/performance/monitor.js http://localhost:3000
 *   node scripts/performance/monitor.js --json              # Output JSON saja
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Thresholds Core Web Vitals berdasarkan rekomendasi Google Web Vitals.
 * @see https://web.dev/articles/vitals
 */
const THRESHOLDS = {
  fcp: { good: 1800, poor: 3000 },
  lcp: { good: 2500, poor: 4000 },
  cls: { good: 0.1, poor: 0.25 },
  tbt: { good: 200, poor: 600 },
  si: { good: 3400, poor: 5800 },
  ttfb: { good: 800, poor: 1800 },
};

/**
 * Evaluasi metrik berdasarkan threshold.
 * @param {string} metric - Nama metrik (fcp, lcp, cls, tbt, si, ttfb)
 * @param {number|null} value - Nilai metrik
 * @returns {'Good'|'Needs Improvement'|'Poor'|'N/A'}
 */
function getScore(metric, value) {
  if (value === null || value === undefined) return 'N/A';

  const threshold = THRESHOLDS[metric];
  if (!threshold) return 'N/A';

  if (value <= threshold.good) return 'Good';
  if (value <= threshold.poor) return 'Needs Improvement';
  return 'Poor';
}

/**
 * Return emoji berdasarkan skor.
 * @param {string} score
 * @returns {string}
 */
function getScoreColor(score) {
  switch (score) {
    case 'Good':
      return '✅';
    case 'Needs Improvement':
      return '⚠️';
    case 'Poor':
      return '❌';
    default:
      return '❓';
  }
}

/**
 * Cek apakah Lighthouse CLI tersedia.
 * @returns {boolean}
 */
function isLighthouseAvailable() {
  try {
    execSync('npx lighthouse --version', { stdio: 'pipe', encoding: 'utf8' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Jalankan Lighthouse audit dan parse hasilnya.
 * @param {string} url - URL target audit
 * @param {string} outputPath - Path untuk menyimpan report JSON
 * @returns {object} Metrics hasil audit
 */
function runLighthouse(url, outputPath) {
  const tmpReport = path.join(path.dirname(outputPath), '.lighthouse-report.tmp.json');

  try {
    console.log('📊 Menjalankan Lighthouse audit...\n');

    execSync(
      `npx lighthouse "${url}" ` +
        `--output=json ` +
        `--output-path="${tmpReport}" ` +
        `--only-categories=performance ` +
        `--chrome-flags="--headless --no-sandbox" ` +
        `--quiet`,
      { stdio: 'pipe', encoding: 'utf8', timeout: 120000 }
    );

    const report = JSON.parse(fs.readFileSync(tmpReport, 'utf8'));

    const metrics = {
      fcp: report.audits['first-contentful-paint']?.numericValue ?? null,
      lcp: report.audits['largest-contentful-paint']?.numericValue ?? null,
      cls: report.audits['cumulative-layout-shift']?.numericValue ?? null,
      tbt: report.audits['total-blocking-time']?.numericValue ?? null,
      si: report.audits['speed-index']?.numericValue ?? null,
      ttfb: report.audits['server-response-time']?.numericValue ?? null,
      performanceScore: report.categories?.performance?.score ?? null,
    };

    return metrics;
  } catch (error) {
    console.error('❌ Lighthouse audit gagal:', error.message);
    return null;
  } finally {
    // Cleanup temp report
    try {
      if (fs.existsSync(tmpReport)) fs.unlinkSync(tmpReport);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Tampilkan hasil metrik ke console.
 * @param {object} metrics
 */
function displayResults(metrics) {
  console.log('🎯 Core Web Vitals Results:\n');

  const displayMetrics = [
    { name: 'First Contentful Paint (FCP)', value: metrics.fcp, unit: 'ms', key: 'fcp' },
    { name: 'Largest Contentful Paint (LCP)', value: metrics.lcp, unit: 'ms', key: 'lcp' },
    { name: 'Cumulative Layout Shift (CLS)', value: metrics.cls, unit: '', key: 'cls' },
    { name: 'Total Blocking Time (TBT)', value: metrics.tbt, unit: 'ms', key: 'tbt' },
    { name: 'Speed Index (SI)', value: metrics.si, unit: 'ms', key: 'si' },
    { name: 'Time to First Byte (TTFB)', value: metrics.ttfb, unit: 'ms', key: 'ttfb' },
  ];

  const scores = {};

  displayMetrics.forEach((metric) => {
    const score = getScore(metric.key, metric.value);
    scores[metric.key] = score;
    const color = getScoreColor(score);
    const displayValue =
      metric.value !== null && metric.value !== undefined ? metric.value.toFixed(2) : 'N/A';

    console.log(`${color} ${metric.name}: ${displayValue}${metric.unit} (${score})`);
  });

  if (metrics.performanceScore !== null && metrics.performanceScore !== undefined) {
    const pct = Math.round(metrics.performanceScore * 100);
    const emoji = pct >= 90 ? '✅' : pct >= 50 ? '⚠️' : '❌';
    console.log(`\n${emoji} Performance Score: ${pct}/100`);
  }

  console.log('\n📈 Performance Summary:');
  const totalCount = Object.keys(scores).length;
  const goodCount = Object.values(scores).filter((s) => s === 'Good').length;
  const niCount = Object.values(scores).filter((s) => s === 'Needs Improvement').length;
  const poorCount = Object.values(scores).filter((s) => s === 'Poor').length;

  console.log(`   Good: ${goodCount}/${totalCount} metrics`);
  console.log(`   Needs Improvement: ${niCount}/${totalCount} metrics`);
  console.log(`   Poor: ${poorCount}/${totalCount} metrics`);

  // Rekomendasi berdasarkan metrik yang tidak "Good"
  console.log('\n💡 Recommendations:');
  const recommendations = {
    lcp: 'Optimize Largest Contentful Paint (LCP) — compress images, preload critical resources',
    cls: 'Fix Cumulative Layout Shift (CLS) — add width/height to images, avoid layout shifts',
    fcp: 'Improve First Contentful Paint (FCP) — inline critical CSS, optimize fonts',
    tbt: 'Reduce Total Blocking Time (TBT) — code split, defer non-critical JavaScript',
    si: 'Improve Speed Index (SI) — reduce main-thread work, optimize rendering',
    ttfb: 'Reduce Time to First Byte (TTFB) — use CDN, optimize server logic',
  };

  let hasRecommendation = false;
  for (const [key, rec] of Object.entries(recommendations)) {
    if (scores[key] !== 'Good' && scores[key] !== 'N/A') {
      console.log(`   • ${rec}`);
      hasRecommendation = true;
    }
  }

  if (!hasRecommendation) {
    console.log('   Semua metrik sudah optimal! 🎉');
  }
}

/**
 * Entry point utama.
 */
async function main() {
  const args = process.argv.slice(2);
  const jsonOnly = args.includes('--json');
  const url = args.find((a) => !a.startsWith('--')) || 'http://localhost:3000';

  // Validasi URL
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.error('❌ URL harus dimulai dengan http:// atau https://');
    process.exit(1);
  }

  // Cek Lighthouse availability
  if (!isLighthouseAvailable()) {
    console.error('❌ Lighthouse CLI tidak ditemukan.');
    console.error('   Install dengan: npm install -g lighthouse');
    console.error('   Atau gunakan: npx lighthouse --version');
    process.exit(1);
  }

  const outputPath = path.join(process.cwd(), 'performance-results.json');
  const metrics = runLighthouse(url, outputPath);

  if (!metrics) {
    console.error('❌ Tidak dapat mengumpulkan metrik performa.');
    process.exit(1);
  }

  if (jsonOnly) {
    console.log(JSON.stringify(metrics, null, 2));
  } else {
    displayResults(metrics);
  }

  // Simpan hasil ke file
  fs.writeFileSync(outputPath, JSON.stringify(metrics, null, 2));
  if (!jsonOnly) {
    console.log(`\n💾 Results saved to: ${outputPath}`);
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
