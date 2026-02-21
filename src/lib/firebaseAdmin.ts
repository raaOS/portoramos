import 'server-only';
import * as admin from 'firebase-admin';

// Initialize the app only if it hasn't been initialized already to avoid duplicate app errors in HMR
const initFirebase = () => {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
        console.warn('[Firebase Admin] Initialization skipped: Missing credentials (expected during build).');
        return null;
    }

    return admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
};

const app = initFirebase();

// Proxy the database to avoid null reference exceptions if accessed before initialization
// At runtime, Vercel provides env vars, so app will be valid. During build, it's null.
export const db = app ? app.database() : new Proxy({} as admin.database.Database, {
    get: function (target, prop) {
        if (prop === 'ref') {
            return () => {
                throw new Error('Firebase Admin database accessed but not initialized due to missing credentials.');
            };
        }
        return Reflect.get(target, prop);
    }
});
