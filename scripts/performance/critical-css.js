#!/usr/bin/env node

/**
 * Critical CSS Generator
 * Extracts and inlines critical CSS for above-the-fold content
 */

const fs = require('fs');
const path = require('path');

// Critical CSS rules for above-the-fold content
const criticalCSS = `
/* Critical CSS for Portfolio */

/* Reset and base styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
  font-size: 16px;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  line-height: 1.5;
  color: #1a1a1a;
  background-color: #ffffff;
  overflow-x: hidden;
}

/* Layout utilities */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.flex {
  display: flex;
}

.grid {
  display: grid;
}

.block {
  display: block;
}

.hidden {
  display: none;
}

/* Typography */
.text-center {
  text-align: center;
}

.text-left {
  text-align: left;
}

.text-right {
  text-align: right;
}

/* Spacing */
.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

.p-4 {
  padding: 1rem;
}

.py-4 {
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

/* Colors */
.text-white {
  color: #ffffff;
}

.text-black {
  color: #000000;
}

.bg-white {
  background-color: #ffffff;
}

.bg-black {
  background-color: #000000;
}

/* Masonry Grid Critical */
.masonry-grid {
  display: flex;
  margin-left: -1rem;
  width: auto;
}

.masonry-grid_column {
  padding-left: 1rem;
  background-clip: padding-box;
}

/* Navigation */
nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

/* Hero section */
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}

.hero h1 {
  font-size: clamp(2rem, 5vw, 4rem);
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.1;
}

.hero p {
  font-size: clamp(1rem, 2vw, 1.5rem);
  opacity: 0.8;
  margin-bottom: 2rem;
}

/* Buttons */
.btn {
  display: inline-block;
  padding: 0.75rem 2rem;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
}

.btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

/* Accessibility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Focus styles */
:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Loading states */
.loading {
  opacity: 0.6;
  pointer-events: none;
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 0 0.5rem;
  }
  
  .hero {
    padding: 1rem;
  }
  
  .hero h1 {
    font-size: 2rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  body {
    background-color: #0a0a0a;
    color: #ffffff;
  }
  
  nav {
    background: rgba(0, 0, 0, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
}

/* Performance optimizations */
img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Critical animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}

.animate-slide-up {
  animation: slideUp 0.8s ease-out forwards;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

function generateCriticalCSS() {
  try {
    console.log('🎨 Generating critical CSS...');

    // Create critical CSS file
    const criticalCSSPath = path.join(process.cwd(), 'public', 'css', 'critical.css');
    const dir = path.dirname(criticalCSSPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(criticalCSSPath, criticalCSS);

    // Calculate size
    const size = Buffer.byteLength(criticalCSS, 'utf8');
    const sizeKB = (size / 1024).toFixed(2);

    console.log(`✅ Critical CSS generated: ${sizeKB}KB`);
    console.log(`📁 Saved to: ${criticalCSSPath}`);

    return {
      success: true,
      size,
      sizeKB,
      path: criticalCSSPath,
    };
  } catch (error) {
    console.error('❌ Critical CSS generation failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Run if called directly
if (require.main === module) {
  const result = generateCriticalCSS();
  process.exit(result.success ? 0 : 1);
}

module.exports = { generateCriticalCSS };
