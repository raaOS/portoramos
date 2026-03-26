import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: '.env.local' });

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
            databaseURL: process.env.FIREBASE_DATABASE_URL
        });
        console.log('Firebase initialized');
    } catch (e) {
        console.error('Failed to initialize Firebase', e);
        process.exit(1);
    }
}

const db = admin.database();

async function check() {
    try {
        const snap = await db.ref('projects').once('value');
        const projects = snap.val();
        if (!projects) {
            console.log('No projects found in database.');
        } else {
            const count = Object.keys(projects).length;
            console.log(`Found ${count} projects in database.`);
            console.log('First project slug:', Object.values(projects)[0].slug);
        }
    } catch (e) {
        console.error('Error fetching projects:', e.message);
    }
    process.exit(0);
}

check();
