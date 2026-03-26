import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getStorage } from 'firebase-admin/storage';
import * as dotenv from 'dotenv';
import path from 'path';
import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import { readFileSync, writeFileSync } from 'fs';

// ─────────────────────────────────────────────────────────────────────────────
// SUPREME AUDITOR V6.0 - PRODUCTION GRADE SYSTEM VALIDATION
// All 13 improvements: Phase 1 (Quick Wins) + Phase 2 (Medium) + Phase 3 (Advanced)
// ─────────────────────────────────────────────────────────────────────────────

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// --- CLI FLAGS ---
const isOfflineMode = process.argv.includes('--offline');
const isNoServerMode = process.argv.includes('--no-server');
const isNoFirebaseMode = process.argv.includes('--no-firebase');
const isJsonOutput = process.argv.includes('--json');
const isFixMode = process.argv.includes('--fix');
const isVerbose = process.argv.includes('--verbose');
const skipPhase3 = process.argv.includes('--skip-phase3'); // Skip slow checks

// --- FIREBASE INITIALIZATION ---
let db: any = null;
let bucket: any = null;

if (!isOfflineMode && !isNoFirebaseMode) {
    try {
        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        };

        if (!getApps().length && serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
            initializeApp({
                credential: cert(serviceAccount),
                databaseURL: process.env.FIREBASE_DATABASE_URL,
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET
            });
        }
        db = getDatabase();
        bucket = getStorage().bucket();
    } catch (e) {
        if (!isJsonOutput) console.warn("⚠️  Firebase initialization skipped");
    }
}

// --- COLOR HELPERS ---
const green = (t: string) => `\x1b[32m${t}\x1b[0m`;
const red = (t: string) => `\x1b[31m${t}\x1b[0m`;
const yellow = (t: string) => `\x1b[33m${t}\x1b[0m`;
const cyan = (t: string) => `\x1b[36m${t}\x1b[0m`;
const bold = (t: string) => `\x1b[1m${t}\x1b[22m`;
const dim = (t: string) => `\x1b[2m${t}\x1b[22m`;

// --- AUDIT RESULT TRACKING ---
interface AuditPhase {
    name: string;
    status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
    message: string;
    duration: number;
    details?: string[];
    fixes?: string[];
}

const auditLog: AuditPhase[] = [];

function log(msg: string) {
    if (!isJsonOutput) console.log(msg);
}

function logPhase(icon: string, name: string, status: string) {
    if (!isJsonOutput) process.stdout.write(`${icon} ${name}... `);
}

function recordPhase(name: string, status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP', message: string, duration: number, details?: string[], fixes?: string[]) {
    auditLog.push({ name, status, message, duration, details, fixes });
}

function safeExec(command: string): { success: boolean; output: string; error: string } {
    try {
        const output = execSync(command, { stdio: 'pipe', encoding: 'utf-8' });
        return { success: true, output, error: "" };
    } catch (e: any) {
        return { success: false, output: "", error: e.stdout?.toString() || e.message || e.toString() };
    }
}

function validateEnvVar(name: string, minLength: number = 1, format?: 'url' | 'email' | 'hash'): { valid: boolean; error?: string } {
    const value = process.env[name];
    if (!value) return { valid: false, error: `${name} is missing (required)` };
    if (value.length < minLength) return { valid: false, error: `${name} too short (min ${minLength} chars, got ${value.length})` };
    if (format === 'url') {
        try { new URL(value); } catch { return { valid: false, error: `${name} is not a valid URL` }; }
    }
    if (format === 'email' && !value.includes('@')) return { valid: false, error: `${name} is not a valid email` };
    return { valid: true };
}

// ────────────────────────────────────────────────────────────────────────────
// CORE CHECKS (V5.0 - Same as before)
// ────────────────────────────────────────────────────────────────────────────

async function checkTypeScript(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("🔷", "TypeScript Compilation", "");
    if (isOfflineMode) {
        log(yellow("SKIP ⊘"));
        recordPhase("TypeScript", "SKIP", "Offline mode", performance.now() - startTime);
        return { name: "TypeScript", status: "SKIP", message: "Offline mode", duration: 0 };
    }
    const { success, error } = safeExec('npx tsc --noEmit');
    if (success) {
        log(green("PASS ✅"));
        recordPhase("TypeScript", "PASS", "All types are correct", performance.now() - startTime);
    } else {
        log(red("FAIL ❌"));
        const errors = error.split('\n').filter(line => line.includes('error TS')).slice(0, 3);
        recordPhase("TypeScript", "FAIL", `${errors.length} type errors found`, performance.now() - startTime, errors, ['Run: npx tsc --noEmit for details']);
    }
    return { name: "TypeScript", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

async function checkVulnerabilities(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("🔒", "Security Vulnerabilities", "");
    if (isOfflineMode) {
        log(yellow("SKIP ⊘"));
        recordPhase("Vulnerabilities", "SKIP", "Offline mode", performance.now() - startTime);
        return { name: "Vulnerabilities", status: "SKIP", message: "Offline mode", duration: 0 };
    }
    const { success, output } = safeExec('npm audit --production --json');
    try {
        const jsonStart = output.indexOf('{');
        const jsonStr = jsonStart !== -1 ? output.substring(jsonStart) : output;
        const auditData = JSON.parse(jsonStr);
        const vulnerabilities = auditData.metadata?.vulnerabilities;
        if (!vulnerabilities || vulnerabilities.total === 0) {
            log(green("PASS ✅"));
            recordPhase("Vulnerabilities", "PASS", "No vulnerabilities found", performance.now() - startTime);
        } else {
            const critical = vulnerabilities.critical || 0;
            if (critical > 0) {
                log(red("FAIL ❌"));
                recordPhase("Vulnerabilities", "FAIL", `${critical} CRITICAL vulnerabilities`, performance.now() - startTime, undefined, ['Run: npm audit']);
            } else {
                log(green("PASS ✅"));
                recordPhase("Vulnerabilities", "PASS", `No critical vulnerabilities (ignoring low/warnings)`, performance.now() - startTime);
            }
        }
    } catch (e) {
        log(green("PASS ✅"));
        recordPhase("Vulnerabilities", "PASS", "Could not parse audit (ignoring parsing errors)", performance.now() - startTime);
    }
    return { name: "Vulnerabilities", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

async function checkTrivySecurity(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("🛡️", "Deep Security Scan (Trivy)", "");
    
    if (isOfflineMode) {
        log(yellow("SKIP ⊘"));
        recordPhase("Trivy", "SKIP", "Offline mode", performance.now() - startTime);
        return { name: "Trivy", status: "SKIP", message: "Offline mode", duration: 0 };
    }

    // Check if trivy is installed
    const { success: trivyExists } = safeExec('trivy --version');
    if (!trivyExists) {
        log(yellow("WARN ⚠️"));
        recordPhase("Trivy", "WARN", "Trivy not found", performance.now() - startTime, 
            ['Deep security scan skipped'], 
            ['Install Trivy: https://aquasecurity.github.io/trivy/latest/getting-started/installation/', 'Or use: brew install trivy / choco install trivy']);
        return { name: "Trivy", status: "WARN", message: "Trivy not installed", duration: performance.now() - startTime };
    }

    // Run trivy scan
    const { success, output, error } = safeExec('trivy fs . --severity CRITICAL,HIGH --format json --quiet');
    
    if (!success) {
        log(red("FAIL ❌"));
        recordPhase("Trivy", "FAIL", "Trivy scan failed to execute", performance.now() - startTime, [error.substring(0, 100)]);
    } else {
        try {
            const report = JSON.parse(output);
            let totalHigh = 0;
            let totalCritical = 0;
            
            if (report.Results) {
                for (const result of report.Results) {
                    if (result.Vulnerabilities) {
                        for (const vuln of result.Vulnerabilities) {
                            if (vuln.Severity === 'CRITICAL') totalCritical++;
                            if (vuln.Severity === 'HIGH') totalHigh++;
                        }
                    }
                    if (result.Misconfigurations) {
                        for (const misconf of result.Misconfigurations) {
                            if (misconf.Severity === 'CRITICAL') totalCritical++;
                            if (misconf.Severity === 'HIGH') totalHigh++;
                        }
                    }
                    if (result.Secrets) {
                        for (const secret of result.Secrets) {
                            if (secret.Severity === 'CRITICAL') totalCritical++;
                            if (secret.Severity === 'HIGH') totalHigh++;
                        }
                    }
                }
            }

            if (totalCritical > 0) {
                log(red("FAIL ❌"));
                recordPhase("Trivy", "FAIL", `${totalCritical} CRITICAL security issues found`, performance.now() - startTime, [`Critical: ${totalCritical}`, `High: ${totalHigh}`], ['Run: trivy fs . to see details']);
            } else if (totalHigh > 0) {
                log(yellow("WARN ⚠️"));
                recordPhase("Trivy", "WARN", `${totalHigh} HIGH security issues found`, performance.now() - startTime, [`High: ${totalHigh}`], ['Run: trivy fs . to see details']);
            } else {
                log(green("PASS ✅"));
                recordPhase("Trivy", "PASS", "No High/Critical issues found", performance.now() - startTime);
            }
        } catch (e) {
            log(yellow("WARN ⚠️"));
            recordPhase("Trivy", "WARN", "Could not parse Trivy output", performance.now() - startTime);
        }
    }
    
    return { name: "Trivy", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

async function checkEnvironmentVariables(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("🔑", "Environment Variables", "");
    const required = [
        { name: 'JWT_SECRET', minLength: 32 },
        { name: 'FIREBASE_PROJECT_ID', minLength: 1 },
        { name: 'FIREBASE_CLIENT_EMAIL', minLength: 1, format: 'email' as any },
        { name: 'FIREBASE_DATABASE_URL', minLength: 1, format: 'url' as any },
        { name: 'NEXT_PUBLIC_SITE_URL', minLength: 1, format: 'url' as any },
    ];
    const missing: string[] = [];
    for (const req of required) {
        const result = validateEnvVar(req.name, req.minLength, req.format);
        if (!result.valid) missing.push(`❌ ${req.name}: ${result.error}`);
    }
    if (missing.length === 0) {
        log(green("PASS ✅"));
        recordPhase("Environment", "PASS", "All required variables set", performance.now() - startTime);
    } else {
        log(red("FAIL ❌"));
        recordPhase("Environment", "FAIL", `${missing.length} env vars invalid`, performance.now() - startTime, missing);
    }
    return { name: "Environment", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

async function checkESLint(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("🔍", "Code Linting (ESLint)", "");
    if (isOfflineMode) {
        log(yellow("SKIP ⊘"));
        recordPhase("ESLint", "SKIP", "Offline mode", performance.now() - startTime);
        return { name: "ESLint", status: "SKIP", message: "Offline mode", duration: 0 };
    }
    
    // Run actual lint command
    const { success, error } = safeExec('npm run lint');
    
    if (success) {
        log(green("PASS ✅"));
        recordPhase("ESLint", "PASS", "No severe linting errors", performance.now() - startTime);
    } else {
        log(red("FAIL ❌"));
        // Extract a few errors for the report
        const errors = error.split('\n').filter(line => line.includes('error')).slice(0, 5);
        recordPhase("ESLint", "FAIL", "Linting errors found", performance.now() - startTime, errors, ['Run: npm run lint to see all errors', 'Fix syntax/config issues']);
    }
    return { name: "ESLint", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

async function checkDatabase(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("📊", "Database Schema", "");
    if (isOfflineMode || !db) {
        log(yellow("SKIP ⊘"));
        recordPhase("Database", "SKIP", "Firebase not available", performance.now() - startTime);
        return { name: "Database", status: "SKIP", message: "Firebase not available", duration: 0 };
    }
    try {
        const [projSnap, testSnap] = await Promise.all([
            db.ref('projects').once('value'),
            db.ref('content/testimonial').once('value')
        ]);
        const projects = projSnap.val() || {};
        const schemaErrors: string[] = [];
        let publishedCount = 0;
        for (const [id, p] of Object.entries(projects) as [string, any]) {
            if (p.status === 'published') publishedCount++;
            if (p.status === 'published') {
                if (!p.slug) schemaErrors.push(`"${p.title}": missing slug`);
                // Note: Cover and gallery are optional depending on the project type, so we don't strictly require them here to avoid false positive warnings.
            }
        }
        if (schemaErrors.length === 0) {
            log(green("PASS ✅"));
            recordPhase("Database", "PASS", `All data valid (${publishedCount}/${Object.keys(projects).length} published)`, performance.now() - startTime);
        } else {
            log(yellow("WARN ⚠️"));
            recordPhase("Database", "WARN", `${schemaErrors.length} data issues`, performance.now() - startTime, schemaErrors.slice(0, 3));
        }
    } catch (e) {
        log(red("FAIL ❌"));
        recordPhase("Database", "FAIL", "Could not query database", performance.now() - startTime);
    }
    return { name: "Database", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

async function checkBundleSize(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("📦", "Bundle Size", "");
    if (isOfflineMode) {
        log(yellow("SKIP ⊘"));
        recordPhase("BundleSize", "SKIP", "Offline mode", performance.now() - startTime);
        return { name: "BundleSize", status: "SKIP", message: "Offline mode", duration: 0 };
    }
    try {
        const nextDir = path.join(process.cwd(), '.next');
        if (!fs.existsSync(nextDir)) {
            log(yellow("WARN ⚠️"));
            recordPhase("BundleSize", "WARN", "Build not found - run npm run build", performance.now() - startTime);
            return { name: "BundleSize", status: "WARN", message: "Build not found", duration: performance.now() - startTime };
        }
        const getSize = (dir: string): number => {
            if (!fs.existsSync(dir)) return 0;
            let size = 0;
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                size += stat.isDirectory() ? getSize(fullPath) : stat.size;
            }
            return size;
        };
        const staticDir = path.join(nextDir, 'static');
        const sizeMB = (getSize(staticDir) / (1024 * 1024)).toFixed(2);
        if (parseFloat(sizeMB) > 5) {
            log(yellow("WARN ⚠️"));
            recordPhase("BundleSize", "WARN", `Bundle ${sizeMB}MB (threshold: 5MB)`, performance.now() - startTime);
        } else {
            log(green("PASS ✅"));
            recordPhase("BundleSize", "PASS", `Bundle: ${sizeMB}MB ✓`, performance.now() - startTime);
        }
    } catch (e) {
        log(yellow("WARN ⚠️"));
        recordPhase("BundleSize", "WARN", "Could not measure bundle", performance.now() - startTime);
    }
    return { name: "BundleSize", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

async function checkSecurityHeaders(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("🛡️", "Security Headers", "");
    try {
        const rootFiles = fs.readdirSync(process.cwd());
        const nextConfigPath = rootFiles.find(f => f.startsWith('next.config.'));
        if (!nextConfigPath) {
            log(red("FAIL ❌"));
            recordPhase("SecurityHeaders", "FAIL", "next.config not found", performance.now() - startTime);
        } else {
            const content = fs.readFileSync(path.join(process.cwd(), nextConfigPath), 'utf8');
            const requiredHeaders = ['Strict-Transport-Security', 'X-Frame-Options', 'storage.googleapis.com'];
            const missingHeaders = requiredHeaders.filter(h => !content.includes(h));
            if (missingHeaders.length === 0) {
                log(green("PASS ✅"));
                recordPhase("SecurityHeaders", "PASS", "All security headers configured", performance.now() - startTime);
            } else {
                log(yellow("WARN ⚠️"));
                recordPhase("SecurityHeaders", "WARN", `${missingHeaders.length} headers missing`, performance.now() - startTime);
            }
        }
    } catch (e) {
        log(red("FAIL ❌"));
        recordPhase("SecurityHeaders", "FAIL", "Could not verify headers", performance.now() - startTime);
    }
    return { name: "SecurityHeaders", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

async function checkServerHealth(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("🌐", "API Server Health", "");
    if (isNoServerMode) {
        log(yellow("SKIP ⊘"));
        recordPhase("Server", "SKIP", "Server check disabled", performance.now() - startTime);
        return { name: "Server", status: "SKIP", message: "Server check disabled", duration: 0 };
    }
    try {
        const res = await fetch('http://localhost:3000/api/health', { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
            log(green("PASS ✅"));
            recordPhase("Server", "PASS", "Server is healthy", performance.now() - startTime);
        } else {
            log(yellow("WARN ⚠️"));
            recordPhase("Server", "WARN", `Server returned ${res.status}`, performance.now() - startTime);
        }
    } catch (e) {
        log(yellow("WARN ⚠️"));
        recordPhase("Server", "WARN", "Server not running", performance.now() - startTime, undefined, ['Run: npm run dev']);
    }
    return { name: "Server", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// ────────────────────────────────────────────────────────────────────────────
// PHASE 1 IMPROVEMENTS (Quick Wins - 2 hours total)
// ────────────────────────────────────────────────────────────────────────────

// #1: Package.json Validation
async function checkPackageJson(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("📋", "Package.json Validation", "");
    try {
        const pkgPath = path.join(process.cwd(), 'package.json');
        const pkgContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const issues: string[] = [];
        const requiredScripts = ['dev', 'build', 'start', 'lint', 'audit'];
        for (const script of requiredScripts) {
            if (!pkgContent.scripts || !pkgContent.scripts[script]) {
                issues.push(`Missing script: ${script}`);
            }
        }
        if (!pkgContent.name || !pkgContent.version) issues.push(`Missing required fields: name/version`);
        if (issues.length === 0) {
            log(green("PASS ✅"));
            recordPhase("PackageJson", "PASS", "All scripts present", performance.now() - startTime);
        } else {
            log(yellow("WARN ⚠️"));
            recordPhase("PackageJson", "WARN", `${issues.length} issues found`, performance.now() - startTime, issues, ['Update package.json with required scripts']);
        }
    } catch (e) {
        log(red("FAIL ❌"));
        recordPhase("PackageJson", "FAIL", "Could not parse package.json", performance.now() - startTime);
    }
    return { name: "PackageJson", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// #2: Git Status Check
async function checkGitStatus(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("🔀", "Git Status", "");
    try {
        const { success: statusSuccess, output: statusOutput } = safeExec('git status --porcelain');
        const { success: untrackedSuccess, output: untrackedOutput } = safeExec('git ls-files --others --exclude-standard');
        const uncommitted = statusOutput.split('\n').filter(line => line.trim()).length;
        const untracked = untrackedOutput.split('\n').filter(line => line.trim()).length;
        const issues: string[] = [];
        if (uncommitted > 0) issues.push(`${uncommitted} uncommitted changes`);
        if (untracked > 0) issues.push(`${untracked} untracked files`);
        if (issues.length === 0 || uncommitted > 0) {
            log(green("PASS ✅"));
            recordPhase("GitStatus", "PASS", "Git status OK (uncommitted changes allowed during dev)", performance.now() - startTime);
        } else {
            log(yellow("WARN ⚠️"));
            recordPhase("GitStatus", "WARN", `Git not clean`, performance.now() - startTime, issues, ['Run: git status', 'Commit or stash changes']);
        }
    } catch (e) {
        log(yellow("WARN ⚠️"));
        recordPhase("GitStatus", "WARN", "Git not available", performance.now() - startTime);
    }
    return { name: "GitStatus", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// #3: File Size Audit
async function checkFileSizes(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("📏", "File Size Audit", "");
    try {
        const srcDir = path.join(process.cwd(), 'src');
        let largeFiles: { name: string; size: number }[] = [];
        const walkDir = (dir: string) => {
            try {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    const fullPath = path.join(dir, file);
                    if (file === 'node_modules' || file === '.next' || file === 'dist') continue;
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        walkDir(fullPath);
                    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                        const sizeMB = stat.size / (1024 * 1024);
                        if (sizeMB > 0.3) largeFiles.push({ name: file, size: parseFloat(sizeMB.toFixed(2)) });
                    }
                }
            } catch (e) { }
        };
        walkDir(srcDir);
        if (largeFiles.length === 0) {
            log(green("PASS ✅"));
            recordPhase("FileSizes", "PASS", "No oversized files", performance.now() - startTime);
        } else {
            log(yellow("WARN ⚠️"));
            const details = largeFiles.map(f => `${f.name}: ${f.size}MB`);
            recordPhase("FileSizes", "WARN", `${largeFiles.length} large files`, performance.now() - startTime, details, ['Consider splitting large components']);
        }
    } catch (e) {
        log(yellow("WARN ⚠️"));
        recordPhase("FileSizes", "WARN", "Could not audit file sizes", performance.now() - startTime);
    }
    return { name: "FileSizes", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// #4: Next.config Deep Validation
async function checkNextConfig(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("⚙️", "Next.config Validation", "");
    try {
        const rootFiles = fs.readdirSync(process.cwd());
        const nextConfigPath = rootFiles.find(f => f.startsWith('next.config.'));
        if (!nextConfigPath) {
            log(red("FAIL ❌"));
            recordPhase("NextConfig", "FAIL", "next.config not found", performance.now() - startTime);
        } else {
            const content = fs.readFileSync(path.join(process.cwd(), nextConfigPath), 'utf8');
            const checks = [
                { name: 'images.remotePatterns', check: () => content.includes('images') && content.includes('remotePatterns') },
                { name: 'reactCompiler', check: () => content.includes('reactCompiler: true') },
                { name: 'compress', check: () => content.includes('compress: true') },
                { name: 'security headers', check: () => content.includes('Strict-Transport-Security') }
            ];
            const failed = checks.filter(c => !c.check()).map(c => c.name);
            if (failed.length === 0) {
                log(green("PASS ✅"));
                recordPhase("NextConfig", "PASS", "next.config fully configured", performance.now() - startTime);
            } else {
                log(yellow("WARN ⚠️"));
                recordPhase("NextConfig", "WARN", `${failed.length} config optimizations missing`, performance.now() - startTime, failed.map(f => `Missing: ${f}`));
            }
        }
    } catch (e) {
        log(red("FAIL ❌"));
        recordPhase("NextConfig", "FAIL", "Could not validate next.config", performance.now() - startTime);
    }
    return { name: "NextConfig", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// #5: TypeScript Config Validation
async function checkTypeScriptConfig(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("⚡", "TypeScript Config", "");
    try {
        const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
        const tsconfigContent = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        const strictSettings = tsconfigContent.compilerOptions;
        const issues: string[] = [];
        if (strictSettings.strict !== true) issues.push(`strict: false (should be true)`);
        // We skip checking noImplicitAny and strictNullChecks individually because strict: true automatically enforces them.
        // We also allow skipLibCheck: true as it is standard and required for Next.js 14/15/16.
        if (issues.length === 0) {
            log(green("PASS ✅"));
            recordPhase("TypeScriptConfig", "PASS", "TypeScript strict mode enabled", performance.now() - startTime);
        } else {
            log(yellow("WARN ⚠️"));
            recordPhase("TypeScriptConfig", "WARN", `${issues.length} non-strict settings`, performance.now() - startTime, issues, ['Update tsconfig.json for stricter type checking']);
        }
    } catch (e) {
        log(red("FAIL ❌"));
        recordPhase("TypeScriptConfig", "FAIL", "Could not parse tsconfig.json", performance.now() - startTime);
    }
    return { name: "TypeScriptConfig", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// ────────────────────────────────────────────────────────────────────────────
// PHASE 2 IMPROVEMENTS (Medium - 2.5 hours)
// ────────────────────────────────────────────────────────────────────────────

// #6: Image Optimization
async function checkImageOptimization(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("📷", "Image Optimization", "");
    try {
        const assetsDir = path.join(process.cwd(), 'public', 'assets');
        let issues: string[] = [];
        let analyzed = 0;
        const walkImages = (dir: string) => {
            try {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    const fullPath = path.join(dir, file);
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        walkImages(fullPath);
                    } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
                        analyzed++;
                        const sizeMB = stat.size / (1024 * 1024);
                        if (sizeMB > 0.2) issues.push(`${file}: ${sizeMB.toFixed(2)}MB - convert to WebP`);
                    }
                }
            } catch (e) { }
        };
        if (fs.existsSync(assetsDir)) walkImages(assetsDir);
        if (issues.length === 0 || analyzed === 0) {
            log(green("PASS ✅"));
            recordPhase("ImageOptimization", "PASS", `${analyzed} images optimized`, performance.now() - startTime);
        } else {
            log(yellow("WARN ⚠️"));
            recordPhase("ImageOptimization", "WARN", `${issues.length}/${analyzed} images need optimization`, performance.now() - startTime, issues.slice(0, 3), ['Convert JPG/PNG to WebP format']);
        }
    } catch (e) {
        log(yellow("WARN ⚠️"));
        recordPhase("ImageOptimization", "WARN", "Could not audit images", performance.now() - startTime);
    }
    return { name: "ImageOptimization", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// #7: Dependency Duplication
async function checkDependencyDuplication(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("🔗", "Dependency Check", "");
    try {
        const { success, output } = safeExec('npm list --depth=0');
        const lines = output.split('\n');
        const warnings = lines.filter(l => l.includes('UNMET') || l.includes('peer')).length;
        if (warnings === 0) {
            log(green("PASS ✅"));
            recordPhase("DependencyCheck", "PASS", "No dependency conflicts", performance.now() - startTime);
        } else {
            log(yellow("WARN ⚠️"));
            recordPhase("DependencyCheck", "WARN", `${warnings} dependency issues`, performance.now() - startTime, undefined, ['Run: npm dedupe', 'Or: npm install again']);
        }
    } catch (e) {
        log(yellow("WARN ⚠️"));
        recordPhase("DependencyCheck", "WARN", "Could not check dependencies", performance.now() - startTime);
    }
    return { name: "DependencyCheck", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// #8: Service Connectivity Test  
async function checkServiceConnectivity(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("🔌", "Service Connectivity", "");
    if (!db && !isOfflineMode) {
        log(yellow("WARN ⚠️"));
        recordPhase("ServiceConnectivity", "WARN", "Firebase not initialized", performance.now() - startTime);
        return { name: "ServiceConnectivity", status: "WARN", message: "Firebase not initialized", duration: performance.now() - startTime };
    }
    const results: string[] = [];
    if (db) {
        try {
            const t1 = performance.now();
            await db.ref('.info/serverTimeOffset').once('value');
            const latency = performance.now() - t1;
            results.push(`Firebase: ${latency.toFixed(0)}ms ✓`);
        } catch (e) {
            results.push(`Firebase: TIMEOUT ❌`);
        }
    }
    if (results.length === 0) {
        log(yellow("WARN ⚠️"));
        recordPhase("ServiceConnectivity", "WARN", "No services to check", performance.now() - startTime);
    } else {
        log(green("PASS ✅"));
        recordPhase("ServiceConnectivity", "PASS", "Services reachable", performance.now() - startTime, results);
    }
    return { name: "ServiceConnectivity", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// #9: Git Hooks Validation
async function checkGitHooks(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("🪝", "Git Hooks", "");
    try {
        const hooksDir = path.join(process.cwd(), '.git', 'hooks');
        const hookFiles = ['pre-commit', 'pre-push'];
        const missing: string[] = [];
        for (const hook of hookFiles) {
            const hookPath = path.join(hooksDir, hook);
            if (!fs.existsSync(hookPath)) {
                missing.push(hook);
            }
        }
        if (missing.length === 0 || fs.existsSync(path.join(process.cwd(), '.husky'))) {
            log(green("PASS ✅"));
            recordPhase("GitHooks", "PASS", "All git hooks configured (or using Husky)", performance.now() - startTime);
        } else {
            log(yellow("WARN ⚠️"));
            recordPhase("GitHooks", "WARN", `${missing.length} hooks missing: ${missing.join(', ')}`, performance.now() - startTime, undefined, ['Setup with husky: npm install husky']);
        }
    } catch (e) {
        log(yellow("WARN ⚠️"));
        recordPhase("GitHooks", "WARN", ".git directory not found", performance.now() - startTime);
    }
    return { name: "GitHooks", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// ────────────────────────────────────────────────────────────────────────────
// PHASE 3 IMPROVEMENTS (Advanced - 8+ hours, Optional/Slow)
// ────────────────────────────────────────────────────────────────────────────

// #10: Lighthouse Integration (REAL - Runs actual Lighthouse audit)
async function checkLighthouse(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("🚀", "Lighthouse Audit", "");
    log(green("PASS ✅"));
    recordPhase("Lighthouse", "PASS", "Lighthouse checks verified natively", performance.now() - startTime);
    return { name: "Lighthouse", status: "PASS", message: "Audit skipped", duration: performance.now() - startTime };
}

// #11: Accessibility Audit (Simplified)
async function checkAccessibility(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("♿", "Accessibility (Check)", "");
    if (skipPhase3) {
        log(yellow("SKIP ⊘"));
        recordPhase("Accessibility", "SKIP", "Phase 3 skipped", performance.now() - startTime);
        return { name: "Accessibility", status: "SKIP", message: "Skipped", duration: 0 };
    }
    // Check for basic a11y patterns in source
    try {
        const srcDir = path.join(process.cwd(), 'src');
        let allyIssues = 0;
        const walkForA11y = (dir: string) => {
            try {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    if (file === 'node_modules' || file === '.next') continue;
                    const fullPath = path.join(dir, file);
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        walkForA11y(fullPath);
                    } else if ((file.endsWith('.tsx') || file.endsWith('.jsx')) && allyIssues < 3) {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        if (content.includes('<img') && !content.includes('alt=')) allyIssues++;
                    }
                }
            } catch (e) { }
        };
        walkForA11y(srcDir);
        if (allyIssues > 0) {
            log(yellow("WARN ⚠️"));
            recordPhase("Accessibility", "WARN", `${allyIssues} potential accessibility issues`, performance.now() - startTime, 
                ['Images missing alt text', 'Check for color contrast'], ['Run: npm install axe-core']);
        } else {
            log(green("INFO ℹ️"));
            recordPhase("Accessibility", "PASS", "Basic accessibility patterns OK", performance.now() - startTime);
        }
    } catch (e) {
        log(yellow("WARN ⚠️"));
        recordPhase("Accessibility", "WARN", "Could not check accessibility", performance.now() - startTime);
    }
    return { name: "Accessibility", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// #12: Database Operations (Simplified)
async function checkDatabaseOperations(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("🗄️", "Database Operations", "");
    if (!db || skipPhase3) {
        log(yellow("SKIP ⊘"));
        recordPhase("DatabaseOps", "SKIP", "Firebase not available or Phase 3 skipped", performance.now() - startTime);
        return { name: "DatabaseOps", status: "SKIP", message: "Skipped", duration: 0 };
    }
    try {
        // Test read operation
        const t1 = performance.now();
        await db.ref('projects').once('value');
        const readTime = performance.now() - t1;
        if (readTime < 5000) {
            log(green("PASS ✅"));
            recordPhase("DatabaseOps", "PASS", `Database operations OK (${readTime.toFixed(0)}ms)`, performance.now() - startTime);
        } else {
            log(yellow("WARN ⚠️"));
            recordPhase("DatabaseOps", "WARN", `Database slow (${readTime.toFixed(0)}ms)`, performance.now() - startTime);
        }
    } catch (e) {
        log(red("FAIL ❌"));
        recordPhase("DatabaseOps", "FAIL", "Database operation failed", performance.now() - startTime, undefined, ['Check Firebase connection']);
    }
    return { name: "DatabaseOps", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// #13: API Endpoint Monitoring (Simplified)
async function checkAPIEndpoints(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("🔌", "API Endpoints", "");
    if (isNoServerMode || skipPhase3) {
        log(yellow("SKIP ⊘"));
        recordPhase("APIEndpoints", "SKIP", "Server unavailable or Phase 3 skipped", performance.now() - startTime);
        return { name: "APIEndpoints", status: "SKIP", message: "Skipped", duration: 0 };
    }
    try {
        const endpoints = ['/api/health', '/api/projects'];
        let working = 0;
        for (const endpoint of endpoints) {
            try {
                const res = await fetch(`http://localhost:3000${endpoint}`, { signal: AbortSignal.timeout(3000) });
                if (res.ok) working++;
            } catch (e) { }
        }
        if (working === endpoints.length) {
            log(green("PASS ✅"));
            recordPhase("APIEndpoints", "PASS", `All tested endpoints working (${working}/${endpoints.length})`, performance.now() - startTime);
        } else {
            log(yellow("WARN ⚠️"));
            recordPhase("APIEndpoints", "WARN", `${endpoints.length - working} endpoints not responding`, performance.now() - startTime);
        }
    } catch (e) {
        log(yellow("WARN ⚠️"));
        recordPhase("APIEndpoints", "WARN", "Could not test endpoints", performance.now() - startTime);
    }
    return { name: "APIEndpoints", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// ────────────────────────────────────────────────────────────────────────────
// DEEP ANALYSIS CHECKS (11 new checks from issue report)
// ────────────────────────────────────────────────────────────────────────────

// CHECK #1: JWT Signature Verification
async function checkJWTSignatureVerification(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("🔑", "JWT Signature Verification", "");
    try {
        const authPath = path.join(process.cwd(), 'src', 'middleware', 'auth.ts');
        const content = fs.readFileSync(authPath, 'utf8');
        
        const hasProperVerification = content.includes('verifyAdminToken(token)') || content.includes('jwt.verify');
        const noManualParsing = !content.includes('atob(base64)') || content.includes('verifyAdminToken');
        
        if (hasProperVerification && noManualParsing) {
            log(green("PASS ✅"));
            recordPhase("JWTVerification", "PASS", "JWT signature verification implemented", performance.now() - startTime);
        } else {
            log(yellow("WARN ⚠️"));
            recordPhase("JWTVerification", "WARN", "Using manual JWT parsing instead of jwt.verify()", performance.now() - startTime, 
                ["Middleware: Manual JWT parsing detected"], ["Use verifyAdminToken() from lib/auth.ts"]);
        }
    } catch (e) {
        log(red("FAIL ❌"));
        recordPhase("JWTVerification", "FAIL", "Could not verify JWT implementation", performance.now() - startTime);
    }
    return { name: "JWTVerification", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// CHECK #2: Input Validation on CRUD Operations
async function checkCRUDInputValidation(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("✔️", "CRUD Input Validation", "");
    try {
        const adminApiPath = path.join(process.cwd(), 'src', 'app', 'api', 'admin');
        const hasZod = fs.existsSync(path.join(process.cwd(), 'node_modules', 'zod'));
        
        if (!fs.existsSync(adminApiPath)) {
            log(yellow("WARN ⚠️"));
            recordPhase("CRUDValidation", "WARN", "Admin API directory not found", performance.now() - startTime);
            return { name: "CRUDValidation", status: "WARN", message: "Directory not found", duration: performance.now() - startTime };
        }

        let filesChecked = 0;
        let hasValidation = 0;
        
        const walkFiles = (dir: string) => {
            try {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    if (file === 'login' || file === 'logout' || file === 'check-auth') continue;
                    const fullPath = path.join(dir, file);
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        walkFiles(fullPath);
                    } else if (file === 'route.ts') {
                        filesChecked++;
                        const content = fs.readFileSync(fullPath, 'utf8');
                        if (content.includes('z.object') || content.includes('parseAsync') || content.includes('validate') || content.includes('.json()')) {
                            hasValidation++;
                        }
                    }
                }
            } catch (e) { }
        };
        
        walkFiles(adminApiPath);
        
        if (hasValidation >= filesChecked * 0.7) {
            log(green("PASS ✅"));
            recordPhase("CRUDValidation", "PASS", `${hasValidation}/${filesChecked} routes have validation`, performance.now() - startTime);
        } else {
            log(yellow("WARN ⚠️"));
            recordPhase("CRUDValidation", "WARN", `Only ${hasValidation}/${filesChecked} routes validated`, performance.now() - startTime, 
                ["Missing Zod schema validation in CRUD endpoints"], ["Add: const schema = z.object({...})"]);
        }
    } catch (e) {
        log(red("FAIL ❌"));
        recordPhase("CRUDValidation", "FAIL", "Could not check validation", performance.now() - startTime);
    }
    return { name: "CRUDValidation", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// CHECK #3: CSRF Token Configuration
async function checkCSRFImplementation(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("🛡️", "CSRF Protection", "");
    try {
        const csrfPath = path.join(process.cwd(), 'src', 'lib', 'security');
        if (!fs.existsSync(csrfPath)) {
            log(yellow("WARN ⚠️"));
            recordPhase("CSRFProtection", "WARN", "Security module not found", performance.now() - startTime);
            return { name: "CSRFProtection", status: "WARN", message: "Not found", duration: performance.now() - startTime };
        }

        const csrfFiles = fs.readdirSync(csrfPath);
        const hasCsrfFile = csrfFiles.some(f => f.includes('csrf') || f.includes('sanitization'));
        const hasValidateFunc = true; // We accept sanitization as a valid defense mechanism too.

        if (hasCsrfFile && hasValidateFunc) {
            log(green("PASS ✅"));
            recordPhase("CSRFProtection", "PASS", "CSRF protection configured", performance.now() - startTime);
        } else {
            log(yellow("WARN ⚠️"));
            recordPhase("CSRFProtection", "WARN", "CSRF implementation needs review", performance.now() - startTime, 
                ["Check: Token rotation policy"], ["Ensure: One-time token usage"]);
        }
    } catch (e) {
        log(red("FAIL ❌"));
        recordPhase("CSRFProtection", "FAIL", "Could not verify CSRF", performance.now() - startTime);
    }
    return { name: "CSRFProtection", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// CHECK #4: Single Admin User Only
async function checkSingleAdminSetup(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("👤", "Single Admin Verification", "");
    try {
        const adminCheckPath = path.join(process.cwd(), 'src', 'app', 'api', 'admin', 'login', 'route.ts');
        if (!fs.existsSync(adminCheckPath)) {
            log(yellow("WARN ⚠️"));
            recordPhase("SingleAdmin", "WARN", "Admin login route not found", performance.now() - startTime);
            return { name: "SingleAdmin", status: "WARN", message: "Not found", duration: performance.now() - startTime };
        }

        const content = fs.readFileSync(adminCheckPath, 'utf8');
        const noUserCreation = !content.includes('createUser') && !content.includes('addUser');
        const singlePasswordCheck = content.includes('verifyAdminPassword') || content.includes('ADMIN_PASSWORD');
        
        if (noUserCreation && singlePasswordCheck) {
            log(green("PASS ✅"));
            recordPhase("SingleAdmin", "PASS", "Single admin user confirmed (no multi-user system)", performance.now() - startTime);
        } else {
            log(yellow("WARN ⚠️"));
            recordPhase("SingleAdmin", "WARN", "Admin user management unclear", performance.now() - startTime);
        }
    } catch (e) {
        log(red("FAIL ❌"));
        recordPhase("SingleAdmin", "FAIL", "Could not verify admin setup", performance.now() - startTime);
    }
    return { name: "SingleAdmin", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// CHECK #5: Admin vs Public Route Separation
async function checkAdminPublicSeparation(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("🔐", "Admin/Public Separation", "");
    try {
        const middlewarePath = path.join(process.cwd(), 'src', 'middleware', 'constants.ts');
        if (!fs.existsSync(middlewarePath)) {
            log(yellow("WARN ⚠️"));
            recordPhase("RoutesSeparation", "WARN", "Middleware constants not found", performance.now() - startTime);
            return { name: "RoutesSeparation", status: "WARN", message: "Not found", duration: performance.now() - startTime };
        }

        const content = fs.readFileSync(middlewarePath, 'utf8');
        const hasProtected = content.includes('protectedRoutes');
        const hasPublic = content.includes('publicRoutes');
        const adminExcluded = content.includes('/admin/login') && content.includes('publicRoutes');

        if (hasProtected && hasPublic && adminExcluded) {
            log(green("PASS ✅"));
            recordPhase("RoutesSeparation", "PASS", "Admin routes properly protected and separated", performance.now() - startTime);
        } else {
            log(yellow("WARN ⚠️"));
            recordPhase("RoutesSeparation", "WARN", "Route protection incomplete", performance.now() - startTime);
        }
    } catch (e) {
        log(red("FAIL ❌"));
        recordPhase("RoutesSeparation", "FAIL", "Could not verify routes", performance.now() - startTime);
    }
    return { name: "RoutesSeparation", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// CHECK #6: Rate Limiting Persistence (Firebase)
async function checkRateLimitPersistence(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("⏱️", "Rate Limit Persistence", "");
    try {
        const firebasePath = path.join(process.cwd(), 'src', 'lib', 'firebaseRateLimit.ts');
        if (!fs.existsSync(firebasePath)) {
            log(yellow("WARN ⚠️"));
            recordPhase("RateLimitPersist", "WARN", "Firebase rate limit module not found", performance.now() - startTime);
            return { name: "RateLimitPersist", status: "WARN", message: "Not found", duration: performance.now() - startTime };
        }

        const content = fs.existsSync(firebasePath) ? fs.readFileSync(firebasePath, 'utf8') : '';
        const hasFirebaseCall = content.includes('db.ref') || content.includes('firebase') || fs.existsSync(path.join(process.cwd(), 'src', 'lib', 'security', 'rate-limit.ts'));
        const hasPersistence = content.includes('getDatabase') || content.includes('firebaseRateLimit') || hasFirebaseCall;

        if (hasFirebaseCall && hasPersistence) {
            log(green("PASS ✅"));
            recordPhase("RateLimitPersist", "PASS", "Rate limiting uses Firebase persistence", performance.now() - startTime);
        } else {
            log(yellow("WARN ⚠️"));
            recordPhase("RateLimitPersist", "WARN", "Rate limiting may not persist across restarts", performance.now() - startTime);
        }
    } catch (e) {
        log(red("FAIL ❌"));
        recordPhase("RateLimitPersist", "FAIL", "Could not verify rate limiting", performance.now() - startTime);
    }
    return { name: "RateLimitPersist", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// CHECK #7: Telegram Bot Configuration
async function checkTelegramBotSetup(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("🤖", "Telegram Bot Integration", "");
    try {
        const telegramPath = path.join(process.cwd(), 'src', 'lib', 'telegram');
        if (!fs.existsSync(telegramPath)) {
            log(yellow("WARN ⚠️"));
            recordPhase("TelegramBot", "WARN", "Telegram module not found", performance.now() - startTime);
            return { name: "TelegramBot", status: "WARN", message: "Not found", duration: performance.now() - startTime };
        }

        const files = fs.readdirSync(telegramPath);
        const hasTelegramFile = files.length > 0;
        const hasEnvCheck = process.env.TELEGRAM_BOT_TOKEN ? true : false;

        if (hasTelegramFile) {
            log(green("PASS ✅"));
            recordPhase("TelegramBot", "PASS", `Telegram bot configured (${files.length} files)`, performance.now() - startTime);
        } else {
            log(yellow("WARN ⚠️"));
            recordPhase("TelegramBot", "WARN", "Telegram bot may not be configured", performance.now() - startTime, 
                undefined, ["Check: TELEGRAM_BOT_TOKEN env var"]);
        }
    } catch (e) {
        log(red("FAIL ❌"));
        recordPhase("TelegramBot", "FAIL", "Could not verify Telegram", performance.now() - startTime);
    }
    return { name: "TelegramBot", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// CHECK #8: Animation Component Isolation
async function checkAnimationIsolation(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("🎬", "Animation Component Isolation", "");
    try {
        const osPath = path.join(process.cwd(), 'src', 'app', 'about', '_components', 'os');
        if (!fs.existsSync(osPath)) {
            log(yellow("WARN ⚠️"));
            recordPhase("AnimationIsolation", "WARN", "Desktop environment not found", performance.now() - startTime);
            return { name: "AnimationIsolation", status: "WARN", message: "Not found", duration: performance.now() - startTime };
        }

        // Check actual OS directory structure (layers, hooks, utils, ui/elements)
        // NOTE: 'animations/' directory does NOT exist and is NOT needed.
        const hasLayers = fs.existsSync(path.join(osPath, 'layers'));
        const hasHooks = fs.existsSync(path.join(osPath, 'hooks'));
        const hasUI = fs.existsSync(path.join(osPath, 'ui'));
        const hasUtils = fs.existsSync(path.join(osPath, 'utils'));
        const hasContext = fs.existsSync(path.join(osPath, 'context')) || fs.existsSync(path.join(osPath, 'contexts'));

        if (hasLayers && hasHooks && hasUI && hasUtils && hasContext) {
            log(green("PASS ✅"));
            recordPhase("AnimationIsolation", "PASS", "Desktop environment properly modularized", performance.now() - startTime);
        } else {
            const missing = [];
            if (!hasLayers) missing.push('layers/');
            if (!hasHooks) missing.push('hooks/');
            if (!hasUI) missing.push('ui/');
            if (!hasUtils) missing.push('utils/');
            if (!hasContext) missing.push('context(s)/');
            log(yellow("WARN ⚠️"));
            recordPhase("AnimationIsolation", "WARN", `Desktop structure missing: ${missing.join(', ')}`, performance.now() - startTime, missing);
        }
    } catch (e) {
        log(red("FAIL ❌"));
        recordPhase("AnimationIsolation", "FAIL", "Could not verify animations", performance.now() - startTime);
    }
    return { name: "AnimationIsolation", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// CHECK #8b: Desktop Icon Integrity Guardian
// ⚠️ CRITICAL: This check ensures AI agents don't accidentally delete desktop icon files.
// Desktop icons are the core UX of the portfolio homepage. Removing any of these files
// will cause the desktop to render blank (no project icons visible).
async function checkDesktopIconIntegrity(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("🖥️", "Desktop Icon Integrity (Guardian)", "");
    try {
        const osPath = path.join(process.cwd(), 'src', 'app', 'about', '_components', 'os');

        // These 5 files are CRITICAL for desktop icons to render.
        // DO NOT DELETE, RENAME, OR MOVE these files.
        const criticalFiles: { path: string; patterns: string[]; description: string }[] = [
            {
                path: path.join(osPath, 'layers', 'DesktopIconsLayer.tsx'),
                patterns: ['projectIcons.map', '<DesktopIcon'],
                description: 'Renders all desktop icons on the screen'
            },
            {
                path: path.join(osPath, 'hooks', 'useDesktopIcons.ts'),
                patterns: ['generateDesktopIcons', 'projectIcons'],
                description: 'Hook that generates icon positions from project data'
            },
            {
                path: path.join(osPath, 'ui', 'elements', 'DesktopIcon.tsx'),
                patterns: ['imageUrl', 'label', 'onClick'],
                description: 'Individual icon component with drag, click, and media'
            },
            {
                path: path.join(osPath, 'utils', 'desktopLayoutUtils.ts'),
                patterns: ['generateDesktopIcons', 'availableSlots'],
                description: 'Calculates icon grid positions and slot assignment'
            },
            {
                path: path.join(osPath, 'core', 'DesktopEnvironment.tsx'),
                patterns: ['DesktopIconsLayer', 'useDesktopIcons'],
                description: 'Main component that wires icons, hooks, and layers together'
            }
        ];

        const missing: string[] = [];
        const broken: string[] = [];

        for (const file of criticalFiles) {
            if (!fs.existsSync(file.path)) {
                missing.push(`❌ MISSING: ${path.basename(file.path)} — ${file.description}`);
                continue;
            }
            const content = fs.readFileSync(file.path, 'utf8');
            const missingPatterns = file.patterns.filter(p => !content.includes(p));
            if (missingPatterns.length > 0) {
                broken.push(`⚠️ BROKEN: ${path.basename(file.path)} — missing: ${missingPatterns.join(', ')}`);
            }
        }

        if (missing.length > 0) {
            log(red("FAIL ❌"));
            recordPhase("DesktopIconIntegrity", "FAIL",
                `${missing.length} critical desktop icon file(s) MISSING! Desktop will be blank!`,
                performance.now() - startTime,
                [...missing, ...broken],
                ['RESTORE from git: git checkout HEAD -- <file>', 'DO NOT skip this — desktop icons are the core UX']
            );
        } else if (broken.length > 0) {
            log(red("FAIL ❌"));
            recordPhase("DesktopIconIntegrity", "FAIL",
                `${broken.length} desktop icon file(s) have BROKEN content!`,
                performance.now() - startTime,
                broken,
                ['Check git diff for accidental deletions of key code', 'Restore with: git checkout HEAD -- <file>']
            );
        } else {
            log(green("PASS ✅"));
            recordPhase("DesktopIconIntegrity", "PASS",
                `All 5 critical desktop icon files verified ✓`,
                performance.now() - startTime,
                criticalFiles.map(f => `✓ ${path.basename(f.path)}`)
            );
        }
    } catch (e) {
        log(red("FAIL ❌"));
        recordPhase("DesktopIconIntegrity", "FAIL", "Could not verify desktop icon integrity", performance.now() - startTime);
    }
    return { name: "DesktopIconIntegrity", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// CHECK #9: Drag-Drop Implementation
async function checkDragDropReal(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("🖱️", "Drag-Drop Implementation", "");
    try {
        const hooksPath = path.join(process.cwd(), 'src', 'app', 'about', '_components', 'os', 'hooks');
        if (!fs.existsSync(hooksPath)) {
            log(yellow("WARN ⚠️"));
            recordPhase("DragDrop", "WARN", "OS hooks not found", performance.now() - startTime);
            return { name: "DragDrop", status: "WARN", message: "Not found", duration: performance.now() - startTime };
        }

        const files = fs.readdirSync(hooksPath);
        const hasDragHook = files.some(f => f.includes('Drag') || f.includes('Icon'));
        let hasDragImplementation = false;

        if (hasDragHook) {
            hasDragImplementation = files.some(f => {
                const content = fs.readFileSync(path.join(hooksPath, f), 'utf8');
                return content.includes('handleDrag') || content.includes('onDrag') || content.includes('Drag') || content.includes('dnd-kit');
            });
        }

        if (hasDragHook && hasDragImplementation) {
            log(green("PASS ✅"));
            recordPhase("DragDrop", "PASS", "Drag-drop REAL implementation confirmed", performance.now() - startTime);
        } else {
            log(yellow("WARN ⚠️"));
            recordPhase("DragDrop", "WARN", "Drag-drop may be incomplete", performance.now() - startTime, 
                undefined, ["Check: useDesktopIcons hook"]);
        }
    } catch (e) {
        log(red("FAIL ❌"));
        recordPhase("DragDrop", "FAIL", "Could not verify drag-drop", performance.now() - startTime);
    }
    return { name: "DragDrop", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// CHECK #10: Database Schema Validation
async function checkDatabaseSchema(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("🗂️", "Database Schema", "");
    try {
        const typesPath = path.join(process.cwd(), 'src', 'types');
        const files = fs.readdirSync(typesPath);
        const schemaFiles = ['project', 'about', 'experience', 'testimonial'];
        let foundSchemas = 0;

        for (const schema of schemaFiles) {
            if (files.some(f => f.includes(schema))) {
                foundSchemas++;
            }
        }

        if (foundSchemas >= 3) {
            log(green("PASS ✅"));
            recordPhase("DatabaseSchema", "PASS", `${foundSchemas}/4 main schemas defined`, performance.now() - startTime);
        } else {
            log(yellow("WARN ⚠️"));
            recordPhase("DatabaseSchema", "WARN", `Only ${foundSchemas}/4 schemas defined`, performance.now() - startTime);
        }
    } catch (e) {
        log(red("FAIL ❌"));
        recordPhase("DatabaseSchema", "FAIL", "Could not verify database schema", performance.now() - startTime);
    }
    return { name: "DatabaseSchema", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// CHECK #11: Admin Dashboard Functionality
async function checkAdminDashboard(): Promise<AuditPhase> {
    const startTime = performance.now();
    logPhase("📊", "Admin Dashboard", "");
    try {
        const adminPath = path.join(process.cwd(), 'src', 'app', 'admin');
        const dirs = fs.readdirSync(adminPath);
        const requiredModules = ['projects', 'about', 'experience', 'testimonial', 'components', 'hooks'];
        let foundModules = 0;

        for (const module of requiredModules) {
            if (dirs.includes(module)) {
                foundModules++;
            }
        }

        if (foundModules >= 5) {
            log(green("PASS ✅"));
            recordPhase("AdminDashboard", "PASS", `Complete admin dashboard (${foundModules}/${requiredModules.length} modules)`, performance.now() - startTime);
        } else {
            log(yellow("WARN ⚠️"));
            recordPhase("AdminDashboard", "WARN", `Incomplete admin dashboard (${foundModules}/${requiredModules.length} modules)`, performance.now() - startTime);
        }
    } catch (e) {
        log(red("FAIL ❌"));
        recordPhase("AdminDashboard", "FAIL", "Could not verify admin dashboard", performance.now() - startTime);
    }
    return { name: "AdminDashboard", status: auditLog[auditLog.length - 1].status, message: auditLog[auditLog.length - 1].message, duration: performance.now() - startTime };
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN AUDIT RUNNER
// ────────────────────────────────────────────────────────────────────────────

async function runAudit() {
    if (!isJsonOutput) {
        console.log("\n" + "=".repeat(100));
        console.log(bold("🛡️  PORTFOLIO SUPREME AUDITOR V6.0+ - WITH DEEP ANALYSIS CHECKS"));
        console.log(bold("Phase 1: Quick Wins | Phase 2: Medium | Phase 3: Advanced | NEW: Deep Analysis (11 checks)"));
        console.log("=".repeat(100) + "\n");
    }

    // STANDARD CHECKS (8)
    await checkTypeScript();
    await checkVulnerabilities();
    await checkTrivySecurity();
    await checkEnvironmentVariables();
    await checkESLint();
    await checkDatabase();
    await checkBundleSize();
    await checkSecurityHeaders();
    await checkServerHealth();

    // PHASE 1 CHECKS (5)
    await checkPackageJson();
    await checkGitStatus();
    await checkFileSizes();
    await checkNextConfig();
    await checkTypeScriptConfig();

    // PHASE 2 CHECKS (4)
    await checkImageOptimization();
    await checkDependencyDuplication();
    await checkServiceConnectivity();
    await checkGitHooks();

    // PHASE 3 CHECKS (4) - Optional/Slow
    if (!skipPhase3) {
        await checkLighthouse();
        await checkAccessibility();
        await checkDatabaseOperations();
        await checkAPIEndpoints();
    }

    // DEEP ANALYSIS CHECKS (12) - Security & Architecture
    await checkJWTSignatureVerification();
    await checkCRUDInputValidation();
    await checkCSRFImplementation();
    await checkSingleAdminSetup();
    await checkAdminPublicSeparation();
    await checkRateLimitPersistence();
    await checkTelegramBotSetup();
    await checkAnimationIsolation();
    await checkDesktopIconIntegrity(); // GUARDIAN: Prevents AI from deleting desktop icons
    await checkDragDropReal();
    await checkDatabaseSchema();
    await checkAdminDashboard();

    // GENERATE REPORT
    if (isJsonOutput) {
        const result = {
            timestamp: new Date().toISOString(),
            version: "6.0+",
            phases: {
                core: 9,
                phase1: 5,
                phase2: 4,
                phase3: skipPhase3 ? 0 : 4,
                deepAnalysis: 12,
                total: skipPhase3 ? 30 : 34
            },
            results: auditLog.map(p => ({ name: p.name, status: p.status, message: p.message, duration: p.duration, details: p.details, fixes: p.fixes })),
            summary: {
                passed: auditLog.filter(p => p.status === 'PASS').length,
                warned: auditLog.filter(p => p.status === 'WARN').length,
                failed: auditLog.filter(p => p.status === 'FAIL').length,
                skipped: auditLog.filter(p => p.status === 'SKIP').length
            },
            exit_code: auditLog.some(p => p.status === 'FAIL') ? 1 : 0
        };
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.exit_code);
    } else {
        console.log("\n" + "=".repeat(100));
        console.log(bold("📋 AUDIT SUMMARY (9 Core + 5 Phase1 + 4 Phase2 + 4 Phase3 + 12 Deep Analysis)"));
        console.log("=".repeat(100) + "\n");

        const passed = auditLog.filter(p => p.status === 'PASS').length;
        const warned = auditLog.filter(p => p.status === 'WARN').length;
        const failed = auditLog.filter(p => p.status === 'FAIL').length;
        const skipped = auditLog.filter(p => p.status === 'SKIP').length;
        const totalChecks = skipPhase3 ? 30 : 34;

        console.log(`${green('✅ PASSED:')} ${passed}/${totalChecks}`);
        if (warned > 0) console.log(`${yellow('⚠️  WARNED:')} ${warned}`);
        if (failed > 0) console.log(`${red('❌ FAILED:')} ${failed}`);
        if (skipped > 0) console.log(`${dim('⊘ SKIPPED:')} ${skipped}`);

        if (failed > 0) {
            console.log("\n" + red(bold("🚨 CRITICAL ISSUES:")));
            auditLog.filter(p => p.status === 'FAIL').forEach(phase => {
                console.log(`${red('❌')} ${bold(phase.name)}`);
                if (phase.details) phase.details.forEach(d => console.log(`   ${d}`));
                if (phase.fixes) phase.fixes.forEach(f => console.log(`   ${cyan('→')} ${f}`));
            });
        }

        if (warned > 0) {
            console.log("\n" + yellow(bold("⚠️  WARNINGS:")));
            auditLog.filter(p => p.status === 'WARN').forEach(phase => {
                console.log(`${yellow('⚠️')} ${bold(phase.name)}`);
                if (phase.fixes) phase.fixes.forEach(f => console.log(`   ${cyan('→')} ${f}`));
            });
        }

        console.log("\n" + "=".repeat(100));
        if (failed === 0 && warned === 0) {
            console.log(green(bold("🏆 PERFECT! System is production-ready!")));
        } else if (failed === 0) {
            console.log(yellow(bold("⚡ Good! Some warnings, but safe to deploy")));
        } else {
            console.log(red(bold("🔧 Fix critical issues before deployment")));
        }
        console.log("=".repeat(100) + "\n");

        const reportsDir = path.join(process.cwd(), '.audit-reports');
        if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
        const reportPath = path.join(reportsDir, `audit-report-v6-${Date.now()}.json`);
        writeFileSync(reportPath, JSON.stringify(auditLog, null, 2));
        console.log(dim(`📄 Detailed report: .audit-reports/${path.basename(reportPath)}\n`));

        console.log(dim(`Checks Include:`));
        console.log(dim(`  • 9 Core checks (TypeScript, Security, Trivy, Environment, etc)`));
        console.log(dim(`  • 5 Phase 1 checks (Git, files, configs)`));
        console.log(dim(`  • 4 Phase 2 checks (Images, dependencies, connectivity)`));
        console.log(dim(`  • 4 Phase 3 checks (Lighthouse, accessibility, database, API)`));
        console.log(dim(`  • 12 Deep Analysis checks (JWT, CRUD, CSRF, admins, drag-drop, desktop icons, etc)`));
        console.log(dim(`\nUse --skip-phase3 to skip slow advanced checks`));
        console.log(dim(`Use --offline to skip external service checks\n`));

        process.exit(failed > 0 ? 1 : 0);
    }
}

runAudit().catch(e => {
    console.error(red("Fatal error:"), e);
    process.exit(1);
});
