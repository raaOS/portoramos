require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(fs.readFileSync('service-account.json', 'utf8'))),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
}

const db = admin.database();
const bucket = admin.storage().bucket();

const ASSETS_DIR = path.join(process.cwd(), 'public', 'assets', 'projects');

async function migrate() {
    console.log('--- Starting Global Asset URL Migration ---');

    // 1. Get all public URLs for files in storage
    console.log('Fetching existing file URLs from Storage...');
    const [files] = await bucket.getFiles({ prefix: 'projects/' });
    const urlMap = {};

    for (const file of files) {
        // Ensure file is public
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
        const localPath = `/assets/projects/${path.basename(file.name)}`;
        urlMap[localPath] = publicUrl;
        // console.log(`Mapped: ${localPath} -> ${publicUrl}`);
    }
    console.log(`Mapped ${Object.keys(urlMap).length} files.`);

    // 2. Fetch the entire database (caution: only for small to medium DBs like this one)
    console.log('Fetching entire database for global find-and-replace...');
    const snapshot = await db.ref('/').once('value');
    let data = snapshot.val();

    // 3. Recursive find-and-replace
    let totalReplacements = 0;
    function replaceUrls(obj) {
        if (!obj) return obj;

        if (typeof obj === 'string') {
            if (urlMap[obj]) {
                totalReplacements++;
                return urlMap[obj];
            }
            // Fallback for paths without leading slash if any
            const nonSlashPath = obj.startsWith('/') ? obj : '/' + obj;
            if (urlMap[nonSlashPath]) {
                totalReplacements++;
                return urlMap[nonSlashPath];
            }
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => replaceUrls(item));
        }

        if (typeof obj === 'object') {
            const newObj = {};
            for (const key in obj) {
                newObj[key] = replaceUrls(obj[key]);
            }
            return newObj;
        }

        return obj;
    }

    const updatedData = replaceUrls(data);

    if (totalReplacements > 0) {
        console.log(`Performing ${totalReplacements} replacements...`);
        await db.ref('/').set(updatedData);
        console.log('Database updated successfully.');
    } else {
        console.log('No replacement targets found.');
    }

    console.log('--- Migration Complete ---');
    process.exit(0);
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
