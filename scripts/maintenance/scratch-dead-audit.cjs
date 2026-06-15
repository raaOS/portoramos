/**
 * Scratch Dead Audit — Audit file scratch yang tidak terpakai.
 *
 * Memindai direktori scratch/, src/, scripts/, dan tests/ untuk
 * menemukan file yang sudah tidak direferensikan lagi oleh kode lain.
 *
 * @module scripts/maintenance/scratch-dead-audit
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const SCAN_ROOTS = ['src', 'scripts', 'tests', 'scratch'];
const SCAN_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

// Gather all files in scan roots (full codebase, including tests + scripts + app/)
function gatherAll(dir, list) {
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next' || e.name === '.git') continue;
      gatherAll(full, list);
    } else {
      list.push(full);
    }
  }
  return list;
}

const allFiles = [];
for (const r of SCAN_ROOTS) gatherAll(path.join(root, r), allFiles);
// Also include root config files
for (const f of fs.readdirSync(root)) {
  const full = path.join(root, f);
  if (fs.statSync(full).isFile()) allFiles.push(full);
}

// Helper: try to resolve an import specifier from a given source file path to an absolute file path.
const candidateExts = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
const indexNames = ['index.ts', 'index.tsx', 'index.js', 'index.jsx'];

function resolveSpecifier(spec, fromFile) {
  let basePath = null;
  if (spec.startsWith('@/')) {
    basePath = path.join(root, 'src', spec.slice(2));
  } else if (spec.startsWith('.') || spec.startsWith('/')) {
    basePath = path.resolve(path.dirname(fromFile), spec);
  } else {
    return null; // node module
  }
  // 1. exact file with known ext
  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) return basePath;
  // 2. with each ext
  for (const ext of candidateExts) {
    if (fs.existsSync(basePath + ext)) return basePath + ext;
  }
  // 3. as directory + index
  if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
    for (const idx of indexNames) {
      const cand = path.join(basePath, idx);
      if (fs.existsSync(cand)) return cand;
    }
  }
  // 4. css fallback
  if (fs.existsSync(basePath + '.css')) return basePath + '.css';
  if (fs.existsSync(basePath + '.module.css')) return basePath + '.module.css';
  return null;
}

// Collect all import / dynamic import / require references
// imports:  Map<resolvedAbsPath, Set<importerAbsPath>>
const refMap = new Map();

const importRegexes = [
  /import\s+[^"';]*?from\s+["'`]([^"'`]+)["'`]/g, // static
  /import\s+["'`]([^"'`]+)["'`]/g, // bare side-effect
  /import\(\s*["'`]([^"'`]+)["'`]\s*\)/g, // dynamic
  /require\(\s*["'`]([^"'`]+)["'`]\s*\)/g, // require
  /export\s+\{[^}]*\}\s+from\s+["'`]([^"'`]+)["'`]/g, // export from
  /export\s+\*\s+from\s+["'`]([^"'`]+)["'`]/g, // re-export
  /export\s+\*\s+as\s+\w+\s+from\s+["'`]([^"'`]+)["'`]/g, // re-export as
];

for (const f of allFiles) {
  const ext = path.extname(f).toLowerCase();
  if (!SCAN_EXTS.has(ext) && ext !== '.css' && ext !== '.json' && ext !== '.md') continue;
  if (!['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(ext)) continue;
  let content;
  try {
    content = fs.readFileSync(f, 'utf8');
  } catch {
    continue;
  }
  const seen = new Set();
  for (const re of importRegexes) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(content)) !== null) {
      const spec = m[1];
      if (seen.has(spec)) continue;
      seen.add(spec);
      const resolved = resolveSpecifier(spec, f);
      if (!resolved) continue;
      if (!refMap.has(resolved)) refMap.set(resolved, new Set());
      refMap.get(resolved).add(f);
    }
  }
}

// Now, in-scope files: src/components/**, src/lib/**, src/hooks/**, src/contexts/**, src/utils/**, src/data/**, src/types/**, src/middleware/**, src/constants/**, src/dictionaries/**, src/styles/**
// excluding __tests__, *.test.*, *.spec.*, *.json
const inScopeRoots = [
  ['components'],
  ['lib'],
  ['hooks'],
  ['contexts'],
  ['utils'],
  ['data'],
  ['types'],
  ['middleware'],
  ['constants'],
  ['dictionaries'],
  ['styles'],
];

function isInScope(absPath) {
  const rel = path.relative(path.join(root, 'src'), absPath).replace(/\\/g, '/');
  if (rel.startsWith('..')) return false;
  if (/(__tests__|\.test\.|\.spec\.)/.test(rel)) return false;
  const ext = path.extname(rel);
  // Allow .ts/.tsx in all, .css in styles
  const inFolder = inScopeRoots.find((r) => rel.startsWith(r[0] + '/'));
  if (!inFolder) return false;
  if (inFolder[0] === 'styles') {
    return ext === '.css';
  }
  if (inFolder[0] === 'data') {
    return ext === '.ts' || ext === '.tsx';
  }
  return ext === '.ts' || ext === '.tsx';
}

const inScope = [];
for (const f of allFiles) {
  if (isInScope(f)) inScope.push(f);
}

// For each in-scope file, check if it has any importer
const orphans = [];
for (const f of inScope) {
  const importers = refMap.get(f);
  const importerCount = importers ? importers.size : 0;
  orphans.push({
    file: path.relative(root, f).replace(/\\/g, '/'),
    importers: importers
      ? Array.from(importers).map((x) => path.relative(root, x).replace(/\\/g, '/'))
      : [],
  });
}

orphans.sort((a, b) => a.importers.length - b.importers.length || a.file.localeCompare(b.file));

const noImporters = orphans.filter((o) => o.importers.length === 0);
console.log('=== FILES WITH ZERO RESOLVED IMPORTERS ===');
console.log('Total:', noImporters.length);
for (const o of noImporters) {
  console.log(o.file);
}
console.log('\n=== FILES WITH 1 IMPORTER ===');
const one = orphans.filter((o) => o.importers.length === 1);
console.log('Total:', one.length);
for (const o of one) {
  console.log(o.file, '<-', o.importers[0]);
}
