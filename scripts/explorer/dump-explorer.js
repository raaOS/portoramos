const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local because dotenv might be acting up in this environment
const envPath = path.resolve(__dirname, '../../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        env[match[1]] = value;
    }
});

const projectId = env.FIREBASE_PROJECT_ID;
const clientEmail = env.FIREBASE_CLIENT_EMAIL;
const dbUrl = env.FIREBASE_DATABASE_URL;
let privateKey = env.FIREBASE_PRIVATE_KEY;

if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
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

async function dumpExplorer() {
    try {
        console.log('Fetching explorer/nodes...');
        const snapshot = await db.ref('explorer/nodes').once('value');
        const data = snapshot.val();
        if (!data) {
            console.log('No data found at explorer/nodes');
            return;
        }
        console.log('--- DATA START ---');
        console.log(JSON.stringify(data, null, 2));
        console.log('--- DATA END ---');
    } catch (error) {
        console.error('Error dumping data:', error);
    } finally {
        process.exit();
    }
}

dumpExplorer();

