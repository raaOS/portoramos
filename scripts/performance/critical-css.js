#!/usr/bin/env node

/**
 * Critical CSS Generator
 * ======================
 * Menghasilkan file `public/css/critical.css` yang berisi CSS di atas garis lipat
 * (above-the-fold) untuk mengurangi First Contentful Paint (FCP).
 *
 * Pendekatan:
 *   1. Jika build output Next.js tersedia (.next/static/css/), baca dan ekstrak
 *      CSS rules yang relevan untuk boot sequence & desktop shell.
 *   2. Jika build belum ada, gunakan curated CSS yang sesuai dengan arsitektur
 *      OS-style desktop simulator (bukan landing page konvensional).
 *
 * Output: public/css/critical.css (target < 14 KB agar muat dalam 1 TCP round-trip)
 *
 * Penggunaan:
 *   node scripts/performance/critical-css.js
 *   node scripts/performance/critical-css.js --from-build   # Ekstrak dari Next.js build
 */

const fs = require('fs');
const path = require('path');

/**
 * Curated critical CSS untuk OS-style desktop simulator.
 * CSS ini dirancang khusus untuk boot sequence dan initial desktop render —
 * bukan landing page konvensional (proyek ini tidak punya hero section / nav / btn).
 *
 * Mencakup:
 *   - CSS reset minimal & box-sizing
 *   - Design tokens (CSS custom properties) yang dipakai di boot & desktop
 *   - Boot sequence animation (loading screen sebelum desktop muncul)
 *   - Dark mode default (proyek ini dark-first)
 *   - Accessibility utilities (sr-only, focus, reduced-motion, skip-link)
 *   - Layout dasar untuk body & root container
 *   - Prevent FOUC (Flash of Unstyled Content) saat JS hydrate
 */
const CURATED_CRITICAL_CSS = `/* ============================================================
 * Critical CSS — portfolio-shared OS Desktop
 * Generated: ${new Date().toISOString()}
 * Target: Above-the-fold render untuk boot sequence & desktop shell
 * ============================================================ */

/* --- Reset & Box Model --- */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html {
  -webkit-text-size-adjust: 100%;
  -moz-tab-size: 4;
  tab-size: 4;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5;
  scroll-behavior: smooth;
}

body {
  background-color: #000;
  color: #fff;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100dvh;
}

/* --- Design Tokens (CSS Custom Properties) --- */
:root {
  --color-bg: #000000;
  --color-text: #ffffff;
  --color-text-secondary: rgba(255, 255, 255, 0.6);
  --color-border: rgba(255, 255, 255, 0.12);
  --color-surface: rgba(255, 255, 255, 0.06);
  --color-accent: #ff9500;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --z-base: 0;
  --z-window: 100;
  --z-dock: 500;
  --z-menubar: 600;
  --z-modal: 1000;
  --z-notification: 1100;
  --font-mono: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
}

/* --- Root Container --- */
#__next {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

/* --- Boot Sequence (Loading Screen) --- */
.boot-screen {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background: #000;
  z-index: 9999;
  transition: opacity 0.6s ease, visibility 0.6s ease;
}

.boot-screen.fade-out {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.boot-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: #fff;
  border-radius: 50%;
  animation: boot-spin 0.8s linear infinite;
}

@keyframes boot-spin {
  to { transform: rotate(360deg); }
}

/* --- Desktop Shell --- */
.desktop-environment {
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* --- Images --- */
img, video {
  max-width: 100%;
  height: auto;
  display: block;
}

/* --- Accessibility --- */
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

.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  z-index: 10000;
  padding: 0.5rem 1rem;
  background: var(--color-accent);
  color: #000;
  font-weight: 600;
  text-decoration: none;
  border-radius: 0 0 var(--radius-sm) 0;
}

.skip-link:focus {
  top: 0;
}

:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* --- Loading State --- */
[aria-busy="true"] {
  opacity: 0.6;
  pointer-events: none;
}

/* --- Animations --- */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- Reduced Motion --- */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* --- Responsive Base --- */
@media (max-width: 768px) {
  body { font-size: 14px; }
}
`;

/**
 * Coba ekstrak critical CSS dari Next.js build output.
 * @returns {string|null} CSS yang diekstrak, atau null jika build tidak tersedia
 */
function extractFromBuild() {
  const cssDir = path.join(process.cwd(), '.next', 'static', 'css');

  if (!fs.existsSync(cssDir)) {
    return null;
  }

  const cssFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'));

  if (cssFiles.length === 0) {
    return null;
  }

  console.log(`📂 Ditemukan ${cssFiles.length} file CSS di build output`);

  // Gabungkan semua CSS dari build
  let combined = '';
  for (const file of cssFiles) {
    const content = fs.readFileSync(path.join(cssDir, file), 'utf8');
    combined += content + '\n';
  }

  // Ekstrak rules yang relevan untuk critical path
  // Prioritas: :root variables, body, #__next, boot-*, desktop-*, sr-only, :focus
  const criticalPatterns = [
    /\/\*\s*Critical[\s\S]*?\*\//gi,
    /:root\s*\{[^}]*\}/g,
    /body\s*\{[^}]*\}/g,
    /#__next\s*\{[^}]*\}/g,
    /\.boot-[\s\S]*?\}/g,
    /\.desktop-environment\s*\{[^}]*\}/g,
    /\.sr-only\s*\{[^}]*\}/g,
    /\.skip-link[\s\S]*?\}/g,
    /:focus-visible\s*\{[^}]*\}/g,
    /@keyframes\s+boot-[\s\S]*?\}/g,
    /@keyframes\s+fade-in[\s\S]*?\}/g,
    /@media\s*\(prefers-reduced-motion[\s\S]*?\}\s*\}/g,
  ];

  let extracted = '';
  for (const pattern of criticalPatterns) {
    const matches = combined.match(pattern);
    if (matches) {
      extracted += matches.join('\n') + '\n';
    }
  }

  if (extracted.trim().length === 0) {
    return null;
  }

  return `/* ============================================================
 * Critical CSS — Extracted from Next.js Build
 * Generated: ${new Date().toISOString()}
 * Source files: ${cssFiles.join(', ')}
 * ============================================================ */

${extracted.trim()}
`;
}

/**
 * Generate critical CSS file.
 */
function generateCriticalCSS() {
  try {
    const fromBuild = process.argv.includes('--from-build');
    const outputPath = path.join(process.cwd(), 'public', 'css', 'critical.css');
    const dir = path.dirname(outputPath);

    console.log('🎨 Generating critical CSS...');

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let css;

    if (fromBuild) {
      console.log('   Mode: Extract from Next.js build output');
      css = extractFromBuild();
      if (!css) {
        console.log('   ⚠️  Build output tidak ditemukan, fallback ke curated CSS');
        console.log('   💡 Jalankan "npm run build" terlebih dahulu');
        css = CURATED_CRITICAL_CSS;
      }
    } else {
      console.log('   Mode: Curated CSS (gunakan --from-build untuk extract dari build)');
      css = CURATED_CRITICAL_CSS;
    }

    fs.writeFileSync(outputPath, css);

    const size = Buffer.byteLength(css, 'utf8');
    const sizeKB = (size / 1024).toFixed(2);
    const sizeWarn = size > 14336 ? ' ⚠️ Melebihi 14KB target!' : '';

    console.log(`✅ Critical CSS generated: ${sizeKB}KB${sizeWarn}`);
    console.log(`📁 Saved to: ${outputPath}`);

    return { success: true, size, sizeKB, path: outputPath };
  } catch (error) {
    console.error('❌ Critical CSS generation failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  const result = generateCriticalCSS();
  process.exit(result.success ? 0 : 1);
}

module.exports = { generateCriticalCSS };
