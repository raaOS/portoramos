// Verification script
// I'll just write a script that uses firebase-admin directly to check the count.

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(__dirname, '..', '.env.local');
const envLocal = fs.readFileSync(envLocalPath, 'utf8');
const envVars = {};
envLocal.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        envVars[key] = value.replace(/\\n/g, '\n');
    }
});

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: envVars['FIREBASE_PROJECT_ID'],
        clientEmail: envVars['FIREBASE_CLIENT_EMAIL'],
        privateKey: envVars['FIREBASE_PRIVATE_KEY'],
    }),
    databaseURL: envVars['FIREBASE_DATABASE_URL'],
});

async function check() {
    const snap = await admin.database().ref('projects').once('value');
    console.log(`Firebase check: Found ${snap.numChildren()} projects.`);
    process.exit();
}

check();
