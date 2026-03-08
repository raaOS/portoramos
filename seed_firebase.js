require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });
}

const db = admin.database();

async function seed() {
    console.log('--- Starting Firebase Seeding from JSON ---');

    // 1. Seed Projects
    const projectsPath = path.join(__dirname, 'src/data/projects.json');
    if (fs.existsSync(projectsPath)) {
        const projectsData = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
        const projects = projectsData.projects || [];
        const projectsRef = db.ref('projects');

        const projectsObj = {};
        projects.forEach(p => {
            if (p.id) projectsObj[p.id] = p;
        });

        await projectsRef.set(projectsObj);
        console.log(`Seeded ${projects.length} projects.`);
    }

    // 2. Seed Content (About, Experience, etc.)
    const contentFiles = [
        'about.json',
        'experience.json',
        'testimonial.json',
        'hardSkills.json',
        'hardSkillConcepts.json',
        'running-text.json',
        'sticky-notes.json',
        'os-settings.json',
        'settings.json'
    ];

    for (const filename of contentFiles) {
        const filePath = path.join(__dirname, 'src/data', filename);
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const nodeName = filename.replace('.json', '');
            await db.ref(`content/${nodeName}`).set(data);
            console.log(`Seeded content/${nodeName} from ${filename}.`);
        }
    }

    console.log('--- Seeding Complete ---');
    process.exit(0);
}

seed().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
