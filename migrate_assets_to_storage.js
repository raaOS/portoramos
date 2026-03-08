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
    console.log('--- Starting Asset Migration to Firebase Storage ---');

    if (!fs.existsSync(ASSETS_DIR)) {
        console.error('Assets directory not found:', ASSETS_DIR);
        return;
    }

    const files = fs.readdirSync(ASSETS_DIR).filter(file => fs.statSync(path.join(ASSETS_DIR, file)).isFile());
    console.log(`Found ${files.length} files to migrate.`);

    const urlMap = {};

    for (const file of files) {
        const filePath = path.join(ASSETS_DIR, file);
        const destination = `projects/${file}`;

        console.log(`Uploading ${file}...`);

        await bucket.upload(filePath, {
            destination,
            metadata: {
                cacheControl: 'public, max-age=31536000',
            },
        });

        // Make the file public and get URL
        const blob = bucket.file(destination);
        await blob.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

        urlMap[`/assets/projects/${file}`] = publicUrl;
        console.log(`Uploaded: ${file} -> ${publicUrl}`);
    }

    console.log('--- Updating Realtime Database ---');

    // Update Projects
    const projectsRef = db.ref('projects');
    const snapshot = await projectsRef.once('value');
    const projects = snapshot.val();

    if (projects) {
        let updateCount = 0;
        const updates = {};

        Object.keys(projects).forEach(id => {
            const project = projects[id];
            let changed = false;

            // Update cover
            if (project.cover && urlMap[project.cover]) {
                project.cover = urlMap[project.cover];
                changed = true;
            }

            // Update gallery
            if (project.gallery && Array.isArray(project.gallery)) {
                project.gallery = project.gallery.map(item => {
                    if (urlMap[item]) {
                        changed = true;
                        return urlMap[item];
                    }
                    return item;
                });
            }

            if (changed) {
                updates[id] = project;
                updateCount++;
            }
        });

        if (updateCount > 0) {
            await projectsRef.update(updates);
            console.log(`Updated ${updateCount} projects in Realtime Database.`);
        }
    }

    // Update Sticky Gallery
    const galleryFeaturedRef = db.ref('gallery-featured');
    const gallerySnapshot = await galleryFeaturedRef.once('value');
    const galleryData = gallerySnapshot.val();

    // About/Experience might have assets too? 
    // Usually about.json has hero image.
    const aboutRef = db.ref('content/about');
    const aboutSnapshot = await aboutRef.once('value');
    const aboutData = aboutSnapshot.val();

    if (aboutData && aboutData.hero && aboutData.hero.image && urlMap[aboutData.hero.image]) {
        await aboutRef.child('hero/image').set(urlMap[aboutData.hero.image]);
        console.log('Updated About hero image.');
    }

    console.log('--- Migration Complete ---');
    process.exit(0);
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
