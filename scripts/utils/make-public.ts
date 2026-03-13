import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
    });
}

const bucket = admin.storage().bucket();

async function makeAssetsPublic() {
    console.log(`--- Making all files in bucket ${bucket.name} public ---`);
    try {
        const [files] = await bucket.getFiles({ prefix: 'assets/' });
        console.log(`Found ${files.length} files to process.`);

        let successCount = 0;
        let failCount = 0;

        // Process in batches to avoid rate limits
        const batchSize = 50;
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            const promises = batch.map(async (file) => {
                try {
                    await file.makePublic();
                    successCount++;
                } catch (e) {
                    // Sometimes makePublic fails if uniform bucket-level access is enabled.
                    console.error(`Failed to make ${file.name} public:`, (e as Error).message);
                    failCount++;
                }
            });
            await Promise.all(promises);
            console.log(`Processed ${Math.min(i + batchSize, files.length)} / ${files.length}`);
        }

        console.log('\n--- Summary ---');
        console.log(`Successfully made public: ${successCount}`);
        console.log(`Failed: ${failCount}`);
        console.log('--- Process Complete ---');

    } catch (e) {
        console.error('Fatal error:', e);
    }
}

makeAssetsPublic().then(() => process.exit(0));
