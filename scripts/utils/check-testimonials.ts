import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
// @ts-ignore
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function getDb() {
    if (!getApps().length) {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey,
            }),
            databaseURL: process.env.FIREBASE_DATABASE_URL,
        });
    }
    return getDatabase();
}

async function checkTestimonials() {
    try {
        console.log('Fetching testimonials from Firebase Database...');
        const adminDb = getDb();
        const snapshot = await adminDb.ref('testimonial').once('value');
        const data = snapshot.val();
        
        if (!data) {
            console.log('No testimonials found in database.');
            return;
        }

        console.log('\n--- Testimonial Messages with Images ---');
        let count = 0;
        
        if (data.testimonials && Array.isArray(data.testimonials)) {
            data.testimonials.forEach((t: any) => {
                if (t.messages && Array.isArray(t.messages)) {
                    t.messages.forEach((m: any) => {
                        if (m.imageSrc) {
                            console.log(`Testimonial ID: ${t.id}, Msg ID: ${m.id}`);
                            console.log(`URL: ${m.imageSrc}\n`);
                            count++;
                        }
                    });
                }
            });
        }
        
        if (count === 0) {
            console.log('No imageSrc found in any messages.');
        }

        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

checkTestimonials();
