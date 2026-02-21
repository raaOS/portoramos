import 'server-only';
import * as admin from 'firebase-admin';

// Initialize the app lazily to allow Vercel to inject env vars at runtime
export const getFirebaseDb = (): admin.database.Database => {
    if (admin.apps.length > 0) {
        return admin.app().database();
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey) {
        // Remove leading/trailing whitespaces and invisible characters
        privateKey = privateKey.trim();

        // Clean up accidental quotes from Vercel dashboard copy-paste
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
        else if (privateKey.startsWith("'") && privateKey.endsWith("'")) privateKey = privateKey.slice(1, -1);

        // Handle both actual newlines and escaped newlines (\n)
        privateKey = privateKey.replace(/\\n/g, '\n');
    }

    if (!projectId || !clientEmail || !privateKey) {
        console.warn('[Firebase Admin] Initialization skipped: Missing credentials (expected during build).');
        // Return a proxy so it doesn't crash during Next.js static generation, but will throw on real usage
        return new Proxy({} as admin.database.Database, {
            get: function (target, prop) {
                if (prop === 'ref') {
                    return () => {
                        throw new Error('Firebase Admin database accessed but not initialized due to missing credentials.');
                    };
                }
                return Reflect.get(target, prop);
            }
        });
    }

    const app = admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });

    return app.database();
};

// Export db as an object with a getter for backward compatibility with `chatStore.ts`
export const db = new Proxy({} as admin.database.Database, {
    get: function (target, prop) {
        const actualDb = getFirebaseDb();
        const value = Reflect.get(actualDb, prop);
        return typeof value === 'function' ? value.bind(actualDb) : value;
    }
});

