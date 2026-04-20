#!/usr/bin/env node

/**
 * Performance Monitoring Script
 * Monitors Core Web Vitals and performance metrics
 */

const fs = require('fs');
const path = require('path');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fcp: null,
      lcp: null,
      cls: null,
      tbt: null,
      si: null,
      ttfb: null
    };
    this.thresholds = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      cls: { good: 0.1, poor: 0.25 },
      tbt: { good: 200, poor: 600 },
      si: { good: 3400, poor: 5800 },
      ttfb: { good: 800, poor: 1800 }
    };
  }

  measureFCP() {
    return new Promise((resolve) => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime;
              observer.disconnect();
              resolve(entry.startTime);
              return;
            }
          }
        });
        observer.observe({ entryTypes: ['paint'] });
      } else {
        resolve(null);
      }
    });
  }

  measureLCP() {
    return new Promise((resolve) => {
      if ('PerformanceObserver' in window) {
        let lcpValue = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (entry.startTime > lcpValue) {
              lcpValue = entry.startTime;
            }
          }
          this.metrics.lcp = lcpValue;
          observer.disconnect();
          resolve(lcpValue);
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } else {
        resolve(null);
      }
    });
  }

  measureCLS() {
    return new Promise((resolve) => {
      if ('PerformanceObserver' in window) {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (!(entry.hadRecentInput)) {
              clsValue += entry.value;
            }
          }
          this.metrics.cls = clsValue;
          observer.disconnect();
          resolve(clsValue);
        });
        observer.observe({ entryTypes: ['layout-shift'] });
      } else {
        resolve(null);
      }
    });
  }

  measureTBT() {
    return new Promise((resolve) => {
      if ('PerformanceObserver' in window) {
        let tbtValue = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (entry.startTime < 6000) { // Only consider first 6 seconds
              tbtValue += entry.duration - 50;
            }
          }
          this.metrics.tbt = tbtValue;
          observer.disconnect();
          resolve(tbtValue);
        });
        observer.observe({ entryTypes: ['longtask'] });
      } else {
        resolve(null);
      }
    });
  }

  getScore(metric, value) {
    if (value === null) return 'N/A';
    
    const threshold = this.thresholds[metric];
    if (!threshold) return 'Unknown';
    
    if (metric === 'cls') {
      if (value <= threshold.good) return 'Good';
      if (value <= threshold.poor) return 'Needs Improvement';
      return 'Poor';
    } else {
      if (value <= threshold.good) return 'Good';
      if (value <= threshold.poor) return 'Needs Improvement';
      return 'Poor';
    }
  }

  getScoreColor(score) {
    switch (score) {
      case 'Good': return '✅';
      case 'Needs Improvement': return '⚠️';
      case 'Poor': return '❌';
      default: return '❓';
    }
  }

  async collectMetrics() {
    console.log('📊 Collecting Core Web Vitals...\n');
    
    const [fcp, lcp, cls, tbt] = await Promise.all([
      this.measureFCP(),
      this.measureLCP(),
      this.measureCLS(),
      this.measureTBT()
    ]);

    // Calculate SI from existing data
    this.metrics.si = Math.max(fcp || 0, lcp || 0) * 1.1;
    
    // TTFB from navigation timing
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
      }
    }

    return this.metrics;
  }

  displayResults() {
    console.log('🎯 Core Web Vitals Results:\n');
    
    const metrics = [
      { name: 'First Contentful Paint (FCP)', value: this.metrics.fcp, unit: 'ms' },
      { name: 'Largest Contentful Paint (LCP)', value: this.metrics.lcp, unit: 'ms' },
      { name: 'Cumulative Layout Shift (CLS)', value: this.metrics.cls, unit: '' },
      { name: 'Total Blocking Time (TBT)', value: this.metrics.tbt, unit: 'ms' },
      { name: 'Speed Index (SI)', value: this.metrics.si, unit: 'ms' },
      { name: 'Time to First Byte (TTFB)', value: this.metrics.ttfb, unit: 'ms' }
    ];

    metrics.forEach(metric => {
      const score = this.getScore(metric.name.toLowerCase().includes('fcp') ? 'fcp' : 
                                 metric.name.toLowerCase().includes('lcp') ? 'lcp' :
                                 metric.name.toLowerCase().includes('cls') ? 'cls' :
                                 metric.name.toLowerCase().includes('tbt') ? 'tbt' :
                                 metric.name.toLowerCase().includes('si') ? 'si' : 'ttfb', 
                                 metric.value);
      const color = this.getScoreColor(score);
      
      console.log(`${color} ${metric.name}: ${metric.value ? metric.value.toFixed(2) : 'N/A'}${metric.unit} (${score})`);
    });

    console.log('\n📈 Performance Summary:');
    
    const scores = {
      fcp: this.getScore('fcp', this.metrics.fcp),
      lcp: this.getScore('lcp', this.metrics.lcp),
      cls: this.getScore('cls', this.metrics.cls),
      tbt: this.getScore('tbt', this.metrics.tbt)
    };

    const goodCount = Object.values(scores).filter(s => s === 'Good').length;
    const totalCount = Object.keys(scores).length;
    
    console.log(`   Good: ${goodCount}/${totalCount} metrics`);
    console.log(`   Needs Improvement: ${Object.values(scores).filter(s => s === 'Needs Improvement').length}/${totalCount} metrics`);
    console.log(`   Poor: ${Object.values(scores).filter(s => s === 'Poor').length}/${totalCount} metrics`);

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (scores.lcp !== 'Good') {
      console.log('   • Optimize Largest Contentful Paint (LCP) - compress images, preload critical resources');
    }
    if (scores.cls !== 'Good') {
      console.log('   • Fix Cumulative Layout Shift (CLS) - add width/height to images, avoid layout shifts');
    }
    if (scores.fcp !== 'Good') {
      console.log('   • Improve First Contentful Paint (FCP) - inline critical CSS, optimize fonts');
    }
    if (scores.tbt !== 'Good') {
      console.log('   • Reduce Total Blocking Time (TBT) - code split, defer non-critical JavaScript');
    }
  }

  async run() {
    await this.collectMetrics();
    this.displayResults();
    
    // Save results to file
    const resultsPath = path.join(process.cwd(), 'performance-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(this.metrics, null, 2));
    console.log(`\n💾 Results saved to: ${resultsPath}`);
  }
}

// CLI usage
if (require.main === module) {
  const monitor = new PerformanceMonitor();
  monitor.run().catch(console.error);
}

module.exports = { PerformanceMonitor };