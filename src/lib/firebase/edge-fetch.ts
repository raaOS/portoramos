/**
 * Lightweight Firebase Realtime Database REST client for Edge Runtime.
 * Avoids the heavy firebase-admin SDK to eliminate cold starts.
 */

const DB_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL;

export async function fetchFromFirebase<T>(path: string): Promise<T | null> {
    if (!DB_URL) {
        console.error("[EdgeFetch] Missing FIREBASE_DATABASE_URL");
        return null;
    }

    // Clean path and ensure it ends with .json for REST API
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const url = `${DB_URL.replace(/\/$/, '')}/${cleanPath}.json`;

    try {
        const response = await fetch(url, {
            next: { revalidate: 60 }, // ISR support at fetch level
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Firebase REST error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data as T;
    } catch (error) {
        console.error(`[EdgeFetch] Failed to fetch ${path}:`, error);
        return null;
    }
}
