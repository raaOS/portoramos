import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getStorage } from 'firebase-admin/storage';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Initialize Firebase Admin (simulating what lib/firebaseAdmin.ts does)
const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
}

const db = getDatabase();
const bucket = getStorage().bucket();

async function checkGhostFiles() {
    console.log("🔍 [NUCLEAR AUDIT] Starting deep search for Ghost Files...");
    try {
        const validPaths = new Set<string>();
        const stats = {
            projects: 0,
            about: 0,
            testimonial: 0,
            hardSkill: 0,
            totalStored: 0
        };

        const extractPath = (url: string) => {
            if (!url) return;
            try {
                if (url.includes('/o/')) {
                    const path = decodeURIComponent(url.split('/o/')[1].split('?')[0]);
                    validPaths.add(path);
                    return path;
                } else if (url.startsWith('/assets/')) {
                    const path = url.substring(1);
                    validPaths.add(path);
                    return path;
                }
            } catch (e) { }
        };

        // 1. Projects
        console.log("📡 Auditing 'projects'...");
        const projectSnap = await db.ref('projects').once('value');
        const projects = projectSnap.val() || {};
        Object.values(projects).forEach((p: any) => {
            if (p.cover) { extractPath(p.cover); stats.projects++; }
            p.galleryItems?.forEach((i: any) => { if (extractPath(i.src)) stats.projects++; });
            p.galleryGroups?.forEach((g: any) => g.items?.forEach((i: any) => { if (extractPath(i.src)) stats.projects++; }));
            if (p.comparison?.beforeImage) { extractPath(p.comparison.beforeImage); stats.projects++; }
            if (p.comparison?.afterImage) { extractPath(p.comparison.afterImage); stats.projects++; }
        });

        // 2. About (Wallpaper & Icons)
        console.log("📡 Auditing 'content/about'...");
        const aboutSnap = await db.ref('content/about').once('value');
        const about = aboutSnap.val() || {};
        about.wallpaperConfig?.collection?.forEach((w: any) => { if (extractPath(w.url)) stats.about++; });
        if (about.dockConfig) {
            Object.values(about.dockConfig).forEach((d: any) => { if (extractPath(d.iconUrl)) stats.about++; });
        }
        about.hero?.backgroundTrail?.forEach((img: any) => { if (extractPath(img.src)) stats.about++; });

        // 3. Testimonials
        console.log("📡 Auditing 'content/testimonial'...");
        const testSnap = await db.ref('content/testimonial').once('value');
        const testData = testSnap.val() || {};
        testData.testimonials?.forEach((t: any) => {
            t.messages?.forEach((m: any) => { if (extractPath(m.imageSrc)) stats.testimonial++; });
        });

        // 4. Hard Skills
        console.log("📡 Auditing 'content/hardSkill'...");
        const skillSnap = await db.ref('content/hardSkill').once('value');
        const skillData = skillSnap.val() || {};
        skillData.skills?.forEach((s: any) => { if (extractPath(s.iconUrl)) stats.hardSkill++; });

        console.log(`✅ Reference Pass Complete. Found ${validPaths.size} unique storage references.`);
        console.log(`   - Projects: ${stats.projects}`);
        console.log(`   - About/OS: ${stats.about}`);
        console.log(`   - Testimonials: ${stats.testimonial}`);
        console.log(`   - Hard Skills: ${stats.hardSkill}`);

        // 5. Get all files from Storage
        console.log("\n☁️ Fetching ALL physical files from Storage (No Prefix)...");
        const [allFiles] = await bucket.getFiles();

        const storagePaths = allFiles
            .map(file => file.name)
            .filter(name => !name.endsWith('/')); // Remove directory markers

        stats.totalStored = storagePaths.length;
        console.log(`📦 Total physical files in bucket: ${stats.totalStored}`);

        // 6. Final Comparison
        const ghostFiles: string[] = [];
        storagePaths.forEach(path => {
            if (!validPaths.has(path)) {
                ghostFiles.push(path);
            }
        });

        console.log("\n==================================");
        console.log("📊 FINAL AUDIT RESULTS:");
        console.log(`Total References in DB: ${validPaths.size}`);
        console.log(`Total Physical Files:   ${stats.totalStored}`);
        console.log(`👻 GHOST FILES FOUND:   ${ghostFiles.length}`);

        if (ghostFiles.length > 0) {
            console.log("----------------------------------");
            console.log("⚠️ GHOST FILES IDENTIFIED:");
            ghostFiles.forEach(f => console.log(`[!] ${f}`));
            console.log("\nRun this script with --fix to delete them.");
        } else {
            console.log("✨ CLEAN! No garbage found in storage.");
        }
        console.log("==================================\n");

        if (process.argv.includes('--fix') && ghostFiles.length > 0) {
            console.log("🧹 EXECUTING PHYSICAL DELETION...");
            for (const file of ghostFiles) {
                await bucket.file(file).delete();
                console.log(`DELETED: ${file}`);
            }
            console.log("✅ Cleanup complete.");
        }

        process.exit(0);

    } catch (e) {
        console.error("❌ Critical Audit Error:", e);
        process.exit(1);
    }
}

checkGhostFiles();
