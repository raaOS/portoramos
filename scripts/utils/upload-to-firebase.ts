import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import mime from 'mime-types'; // need to install this or manually map extensions

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
    });
}

const bucket = admin.storage().bucket();
const ASSETS_DIR = path.join(process.cwd(), 'public', 'assets');

// Basic manual mime types since mime-types might not be installed
const getMimeType = (filePath: string) => {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.mov': 'video/quicktime'
    };
    return mimeTypes[ext] || 'application/octet-stream';
};

async function walkDir(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    let files: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            const subFiles = await walkDir(fullPath);
            files = files.concat(subFiles);
        } else {
            files.push(fullPath);
        }
    }
    return files;
}

async function uploadAssets() {
    console.log('--- Starting Firebase Asset Upload ---');
    console.log(`Scanning local directory: ${ASSETS_DIR}`);
    
    try {
        const allFiles = await walkDir(ASSETS_DIR);
        console.log(`Found ${allFiles.length} files to process.`);

        let uploadedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const localPath of allFiles) {
            // Reconstruct the storage path: assets/...
            const relativePath = path.relative(path.join(process.cwd(), 'public'), localPath);
            // Replace Windows backslashes with forward slashes for GCS
            const storagePath = relativePath.split(path.sep).join('/');
            
            try {
                const fileRef = bucket.file(storagePath);
                const [exists] = await fileRef.exists();

                if (exists) {
                    // console.log(`[SKIPPED] ${storagePath} already exists.`);
                    skippedCount++;
                    continue;
                }

                console.log(`[UPLOADING] ${storagePath}...`);
                const contentType = getMimeType(localPath);
                
                await bucket.upload(localPath, {
                    destination: storagePath,
                    metadata: {
                        contentType: contentType,
                        cacheControl: 'public, max-age=31536000'
                    }
                });
                
                uploadedCount++;
            } catch (err) {
                console.error(`[ERROR] Failed to upload ${storagePath}:`, err);
                errorCount++;
            }
        }

        console.log('\n--- Upload Summary ---');
        console.log(`Total files found: ${allFiles.length}`);
        console.log(`Successfully uploaded: ${uploadedCount}`);
        console.log(`Skipped (already exist): ${skippedCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log('--- Process Complete ---');

    } catch (e) {
        console.error('Fatal error during upload:', e);
    }
}

uploadAssets().then(() => process.exit(0));
