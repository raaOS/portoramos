const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Load environment variables from .env.local
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

const db = admin.database();

async function migrate() {
    console.log('--- Starting Firebase Migration (Comments) ---');

    const commentsPath = path.join(__dirname, '..', 'src', 'data', 'comments.json');
    if (!fs.existsSync(commentsPath)) {
        console.error('Error: comments.json not found');
        return;
    }

    const data = JSON.parse(fs.readFileSync(commentsPath, 'utf8'));
    const comments = data.comments || {};

    if (Object.keys(comments).length === 0) {
        console.log('No comments found to migrate.');
        return;
    }

    console.log(`Found comments for ${Object.keys(comments).length} projects to migrate.`);

    const commentsRef = db.ref('comments');

    try {
        await commentsRef.set(comments);
        console.log('--- Comments Migration Successful! ---');
    } catch (error) {
        console.error('Comments migration failed:', error);
    } finally {
        process.exit();
    }
}

migrate();
