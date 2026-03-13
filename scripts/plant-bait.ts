import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
}

const bucket = getStorage().bucket();

async function plantBait() {
    const baitName = `assets/PROOF_OF_REAL_AUDIT_${Date.now()}.txt`;
    console.log(`🎣 Planting bait: ${baitName}...`);

    await bucket.file(baitName).save('THIS IS A REAL FILE FOR PROOF', {
        contentType: 'text/plain'
    });

    console.log("✅ Bait planted. Now run: npx tsx scripts/check-ghost-files.ts");
    process.exit(0);
}

plantBait();
