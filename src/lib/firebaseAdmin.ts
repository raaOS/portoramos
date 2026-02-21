import 'server-only';
import * as admin from 'firebase-admin';

// Initialize the app lazily to allow Vercel to inject env vars at runtime
export const getFirebaseDb = (): admin.database.Database => {
    if (admin.apps.length > 0) {
        return admin.app().database();
    }

    // Helper to clean environment variables (removes quotes and trims)
    const cleanEnvVar = (name: string): string | undefined => {
        let val = process.env[name];
        if (!val) return undefined;
        val = val.trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        return val;
    };

    const projectId = cleanEnvVar('FIREBASE_PROJECT_ID');
    const clientEmail = cleanEnvVar('FIREBASE_CLIENT_EMAIL');
    const dbUrl = cleanEnvVar('FIREBASE_DATABASE_URL');
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey) {
        privateKey = privateKey.trim();
        if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
            privateKey = privateKey.slice(1, -1);
        }
        privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const missingVars: string[] = [];
    if (!projectId) missingVars.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missingVars.push('FIREBASE_CLIENT_EMAIL');
    if (!privateKey) missingVars.push('FIREBASE_PRIVATE_KEY');
    if (!dbUrl) missingVars.push('FIREBASE_DATABASE_URL');

    if (missingVars.length > 0) {
        console.warn(`[Firebase Admin] Initialization deferred. Missing: ${missingVars.join(', ')}`);

        return new Proxy({} as admin.database.Database, {
            get: function (target, prop) {
                if (prop === 'ref') {
                    return (path?: string) => {
                        throw new Error(`Firebase Error: Missing environment variables [${missingVars.join(', ')}]. Path: ${path || 'root'}`);
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
        databaseURL: dbUrl,
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

