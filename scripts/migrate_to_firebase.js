const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Load environment variables from .env.local manually for the script
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

const projectId = envVars['FIREBASE_PROJECT_ID'];
const clientEmail = envVars['FIREBASE_CLIENT_EMAIL'];
const privateKey = envVars['FIREBASE_PRIVATE_KEY'];
const databaseURL = envVars['FIREBASE_DATABASE_URL'];

if (!projectId || !clientEmail || !privateKey || !databaseURL) {
    console.error('Error: Missing Firebase environment variables in .env.local');
    process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
    }),
    databaseURL: databaseURL,
});

const db = admin.database();

async function migrate() {
    console.log('--- Starting Firebase Migration ---');

    const projectsPath = path.join(__dirname, '..', 'src', 'data', 'projects.json');
    if (!fs.existsSync(projectsPath)) {
        console.error('Error: projects.json not found');
        return;
    }

    const data = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
    const projects = data.projects || [];

    if (projects.length === 0) {
        console.log('No projects found to migrate.');
        return;
    }

    console.log(`Found ${projects.length} projects to migrate.`);

    const projectsRef = db.ref('projects');

    // Check if projects already exist
    const snapshot = await projectsRef.once('value');
    if (snapshot.exists()) {
        console.log('Note: /projects already has data. Overwriting...');
    }

    // Modern index-based storage or slug-based? 
    // projectService expects a flat list that it sorts by 'order'.
    // Realtime Database works best with an object map or an array (which it treats as an object with numeric keys).
    // We'll store it as an object where keys are project IDs for robustness.

    const projectsMap = {};
    projects.forEach(project => {
        // Ensure ID is clean
        const id = project.id || `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        projectsMap[id] = project;
    });

    try {
        await projectsRef.set(projectsMap);

        // Also update lastUpdated
        await db.ref('lastUpdated').set(data.lastUpdated || new Date().toISOString());

        console.log('--- Migration Successful! ---');
        console.log(`${projects.length} projects uploaded to ${databaseURL}/projects`);
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

migrate();
