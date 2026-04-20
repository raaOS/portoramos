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

async function seed() {
    console.log("Seeding explorer nodes with local assets...");
    
    const folderId = 'demo-featured-projects';
    
    // 1. Create the main folder at root
    const folder = {
        id: folderId,
        type: 'folder',
        name: 'Featured Projects 🚀',
        parentId: null, // explicitly null
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // 2. Sample items within the folder (Local Assets)
    const items = [
        {
            id: 'local-img-1',
            type: 'file',
            fileType: 'image',
            name: 'Desktop Wallpaper.png',
            url: '/wallpapers/optimized-wallpaper.png',
            thumbnailUrl: '/wallpapers/optimized-wallpaper.webp',
            parentId: folderId,
            size: 1442630,
            metadata: { extension: 'png' }
        },
        {
            id: 'local-vid-1',
            type: 'file',
            fileType: 'video',
            name: 'Demo Reel.mp4',
            url: '/assets/test-video.mp4',
            thumbnailUrl: '/assets/whatsapp-bg.webp',
            parentId: folderId,
            size: 788493,
            metadata: { extension: 'mp4', duration: 15 }
        },
        {
            id: 'local-img-2',
            type: 'file',
            fileType: 'image',
            name: 'Project Grid View.png',
            url: '/grid-view.png',
            thumbnailUrl: '/grid-view.png',
            parentId: folderId,
            size: 1264281,
            metadata: { extension: 'png' }
        },
        {
            id: 'local-vid-2',
            type: 'file',
            fileType: 'video',
            name: 'Process Screen Recording.mp4',
            url: '/assets/test-video.mp4',
            thumbnailUrl: '/jelly-effect-active.png', // fallback thumb
            parentId: folderId,
            size: 788493,
            metadata: { extension: 'mp4', duration: 15 }
        },
        {
            id: 'local-img-3',
            type: 'file',
            fileType: 'image',
            name: 'System Architecture.png',
            url: '/infinite-canvas-v2.png',
            thumbnailUrl: '/infinite-canvas-v2.png',
            parentId: folderId,
            size: 700914,
            metadata: { extension: 'png' }
        }
    ];

    const nodesRef = db.ref('explorer/nodes');
    
    // Clear existing nodes to avoid confusion
    await nodesRef.remove();
    
    // Save folder
    await nodesRef.child(folderId).set(folder);
    
    // Save items
    const now = new Date().toISOString();
    for (const item of items) {
        await nodesRef.child(item.id).set({
            ...item,
            createdAt: now,
            updatedAt: now
        });
    }

    console.log("✅ Seeded 1 folder and 5 items successfully with LOCAL assets.");
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});

