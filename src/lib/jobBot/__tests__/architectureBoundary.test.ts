import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Job Bot Architectural Boundary', () => {
  it('ensures no client components, hooks, or contexts import from src/lib/jobBot', () => {
    const srcDir = path.resolve(__dirname, '../../..');
    const clientDirs = [
      path.join(srcDir, 'components'),
      path.join(srcDir, 'hooks'),
      path.join(srcDir, 'contexts'),
    ];

    const violations: string[] = [];

    function scanDir(dir: string) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          // Check for import statements referencing jobBot
          if (/import\s+.*from\s+['"].*jobBot.*['"]/.test(content)) {
            violations.push(fullPath);
          }
        }
      }
    }

    clientDirs.forEach(scanDir);
    expect(violations).toEqual([]);
  });
});
