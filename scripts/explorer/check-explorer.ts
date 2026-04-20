import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const dbUrl = process.env.FIREBASE_DATABASE_URL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (privateKey) {
    privateKey = privateKey.trim().replace(/\\n/g, '\n');
}

if (!projectId || !clientEmail || !privateKey || !dbUrl) {
    console.error("Missing Firebase environment variables.");
    process.exit(1);
}

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
        }),
        databaseURL: dbUrl,
    });
}

const db = admin.database();

async function check() {
    console.log("Checking database at:", dbUrl);
    const snapshot = await db.ref('explorer/nodes').once('value');
    const data = snapshot.val();
    
    if (!data) {
        console.log("❌ No data found in explorer/nodes");
    } else {
        console.log("✅ Found data:", Object.keys(data).length, "nodes");
        console.log(JSON.stringify(data, null, 2));
    }
    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});

