#!/usr/bin/env node

/**
 * Performance Optimization Workflow
 * Complete workflow for achieving 100/100 Lighthouse scores
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PerformanceOptimizer {
  constructor() {
    this.steps = [
      {
        name: 'Generate Critical CSS',
        script: 'scripts/generate-critical-css.js',
        description: 'Extract and inline critical CSS'
      },
      {
        name: 'Optimize Next.js Config',
        script: 'scripts/optimize-next-config.js',
        description: 'Update next.config.mjs with performance settings'
      },
      {
        name: 'Build Application',
        command: 'npm run build',
        description: 'Build with optimizations'
      },
      {
        name: 'Analyze Bundle',
        script: 'scripts/analyze-bundle.js',
        description: 'Analyze bundle size and identify issues'
      },
      {
        name: 'Test Performance',
        script: 'scripts/test-performance.js',
        description: 'Run performance tests'
      }
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'
    };
    
    const color = colors[type] || colors.info;
    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
  }

  async runStep(step) {
    this.log(`\n🚀 Starting: ${step.name}`, 'info');
    this.log(`   ${step.description}`, 'info');
    
    try {
      if (step.script) {
        const scriptPath = path.join(process.cwd(), step.script);
        if (fs.existsSync(scriptPath)) {
          execSync(`node ${scriptPath}`, { stdio: 'inherit' });
        } else {
          this.log(`   Script not found: ${step.script}`, 'warning');
        }
      } else if (step.command) {
        execSync(step.command, { stdio: 'inherit' });
      }
      
      this.log(`   ✅ Completed: ${step.name}`, 'success');
      return true;
      
    } catch (error) {
      this.log(`   ❌ Failed: ${step.name}`, 'error');
      this.log(`   Error: ${error.message}`, 'error');
      return false;
    }
  }

  async run() {
    this.log('🎯 Performance Optimization Workflow Started', 'info');
    this.log('Target: 100/100 Lighthouse Scores\n', 'info');
    
    const results = [];
    
    for (const step of this.steps) {
      const success = await this.runStep(step);
      results.push({ step: step.name, success });
      
      if (!success) {
        this.log('\n⚠️  Workflow stopped due to failure', 'warning');
        break;
      }
    }
    
    this.displayResults(results);
    this.generateReport(results);
  }

  displayResults(results) {
    this.log('\n📊 Optimization Results:', 'info');
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const color = result.success ? '\x1b[32m' : '\x1b[31m';
      console.log(`${color}${status} ${result.step}\x1b[0m`);
    });
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    this.log(`\n📈 Summary: ${successCount}/${totalCount} steps completed successfully`, 'info');
    
    if (successCount === totalCount) {
      this.log('🎉 All optimizations completed! Ready for deployment.', 'success');
      this.log('Next steps:', 'info');
      this.log('   1. Deploy to Vercel: npm run deploy', 'info');
      this.log('   2. Test performance: npm run test:performance', 'info');
      this.log('   3. Run Lighthouse: npm run lighthouse', 'info');
    } else {
      this.log('⚠️  Some optimizations failed. Please fix issues before deployment.', 'warning');
    }
  }

  generateReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      results: results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      },
      recommendations: [
        'Deploy to Vercel and test with Lighthouse',
        'Monitor Core Web Vitals in production',
        'Set up performance monitoring',
        'Configure performance budgets'
      ]
    };
    
    const reportPath = path.join(process.cwd(), 'optimization-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`\n💾 Report saved to: ${reportPath}`, 'info');
  }
}

// CLI usage
if (require.main === module) {
  const optimizer = new PerformanceOptimizer();
  optimizer.run().catch(error => {
    console.error('❌ Workflow failed:', error);
    process.exit(1);
  });
}

module.exports = { PerformanceOptimizer };