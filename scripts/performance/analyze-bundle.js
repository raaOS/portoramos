#!/usr/bin/env node

/**
 * Bundle Size Analyzer
 * Analyzes the build output for performance bottlenecks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BundleAnalyzer {
  constructor() {
    this.buildDir = path.join(process.cwd(), '.next');
    this.analysis = {
      totalSize: 0,
      largestFiles: [],
      issues: [],
      recommendations: [],
    };
  }

  analyzeBuild() {
    console.log('📦 Analyzing build output...\n');

    if (!fs.existsSync(this.buildDir)) {
      console.log('❌ Build directory not found. Run "npm run build" first.');
      return false;
    }

    this.analyzeStaticFiles();
    this.analyzeChunks();
    this.findIssues();
    this.generateRecommendations();

    this.displayResults();
    this.saveReport();

    return true;
  }

  analyzeStaticFiles() {
    const staticDir = path.join(this.buildDir, 'static');
    if (!fs.existsSync(staticDir)) return;

    const files = this.getAllFiles(staticDir);
    files.forEach((file) => {
      const stats = fs.statSync(file);
      const relativePath = path.relative(this.buildDir, file);

      this.analysis.totalSize += stats.size;

      this.analysis.largestFiles.push({
        path: relativePath,
        size: stats.size,
        sizeKB: (stats.size / 1024).toFixed(2),
      });
    });

    // Sort by size
    this.analysis.largestFiles.sort((a, b) => b.size - a.size);
  }

  analyzeChunks() {
    const chunksDir = path.join(this.buildDir, 'static', 'chunks');
    if (!fs.existsSync(chunksDir)) return;

    const chunkFiles = fs
      .readdirSync(chunksDir)
      .filter((file) => file.endsWith('.js') || file.endsWith('.css'))
      .map((file) => {
        const filePath = path.join(chunksDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          sizeKB: (stats.size / 1024).toFixed(2),
        };
      });

    // Find large chunks
    const largeChunks = chunkFiles.filter((chunk) => chunk.size > 100 * 1024); // > 100KB

    if (largeChunks.length > 0) {
      this.analysis.issues.push({
        type: 'large-chunks',
        message: `${largeChunks.length} chunks larger than 100KB`,
        details: largeChunks,
      });
    }
  }

  findIssues() {
    // Check for unused CSS
    const cssFiles = this.analysis.largestFiles.filter(
      (file) => file.path.endsWith('.css') && file.size > 50 * 1024
    );

    if (cssFiles.length > 0) {
      this.analysis.issues.push({
        type: 'large-css',
        message: 'Large CSS files detected',
        details: cssFiles,
      });
    }

    // Check for large images
    const imageFiles = this.analysis.largestFiles.filter((file) =>
      file.path.match(/\.(jpg|jpeg|png|gif|svg|webp|avif)$/i)
    );

    const largeImages = imageFiles.filter((file) => file.size > 200 * 1024);

    if (largeImages.length > 0) {
      this.analysis.issues.push({
        type: 'large-images',
        message: 'Large images detected',
        details: largeImages,
      });
    }

    // Check total bundle size
    const totalSizeMB = this.analysis.totalSize / (1024 * 1024);
    if (totalSizeMB > 2) {
      this.analysis.issues.push({
        type: 'large-bundle',
        message: `Total bundle size: ${totalSizeMB.toFixed(2)}MB (recommended: <2MB)`,
        details: { totalSize: this.analysis.totalSize },
      });
    }
  }

  generateRecommendations() {
    this.analysis.recommendations = [];

    // Large chunks
    const largeChunksIssue = this.analysis.issues.find((i) => i.type === 'large-chunks');
    if (largeChunksIssue) {
      this.analysis.recommendations.push({
        priority: 'high',
        action: 'Code split large chunks',
        details: 'Use dynamic imports and optimize bundle splitting',
      });
    }

    // Large CSS
    const largeCssIssue = this.analysis.issues.find((i) => i.type === 'large-css');
    if (largeCssIssue) {
      this.analysis.recommendations.push({
        priority: 'high',
        action: 'Optimize CSS',
        details: 'Use PurgeCSS, extract critical CSS, and remove unused styles',
      });
    }

    // Large images
    const largeImagesIssue = this.analysis.issues.find((i) => i.type === 'large-images');
    if (largeImagesIssue) {
      this.analysis.recommendations.push({
        priority: 'medium',
        action: 'Optimize images',
        details: 'Use modern formats (AVIF/WebP), compress, and implement lazy loading',
      });
    }

    // General recommendations
    this.analysis.recommendations.push({
      priority: 'medium',
      action: 'Enable compression',
      details: 'Ensure gzip/brotli compression is enabled',
    });

    this.analysis.recommendations.push({
      priority: 'low',
      action: 'Monitor performance',
      details: 'Set up performance monitoring and budgets',
    });
  }

  displayResults() {
    console.log('\n📊 Bundle Analysis Results:\n');

    // Total size
    const totalSizeMB = (this.analysis.totalSize / (1024 * 1024)).toFixed(2);
    console.log(`Total Bundle Size: ${totalSizeMB}MB\n`);

    // Largest files
    console.log('📁 Largest Files:');
    this.analysis.largestFiles.slice(0, 10).forEach((file) => {
      console.log(`   ${file.path}: ${file.sizeKB}KB`);
    });

    // Issues
    if (this.analysis.issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      this.analysis.issues.forEach((issue) => {
        console.log(`   ❌ ${issue.message}`);
      });
    } else {
      console.log('\n✅ No major issues found');
    }

    // Recommendations
    if (this.analysis.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      this.analysis.recommendations.forEach((rec) => {
        const priority = rec.priority.toUpperCase();
        console.log(`   [${priority}] ${rec.action}: ${rec.details}`);
      });
    }
  }

  saveReport() {
    const reportPath = path.join(process.cwd(), 'bundle-analysis.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.analysis, null, 2));
    console.log(`\n💾 Report saved to: ${reportPath}`);
  }

  getAllFiles(dir, files = []) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        this.getAllFiles(fullPath, files);
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }
}

// CLI usage
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  const success = analyzer.analyzeBuild();
  process.exit(success ? 0 : 1);
}

module.exports = { BundleAnalyzer };
