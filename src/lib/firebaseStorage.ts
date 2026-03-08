import { getStorage } from 'firebase-admin/storage';
import { getApps } from 'firebase-admin/app';

// Get storage bucket
const getBucket = () => {
    const app = getApps()[0];
    if (!app) throw new Error('Firebase app not initialized');

    // Get bucket name from app config (set during initialization in firebaseAdmin.ts)
    const bucketName = app.options.storageBucket;
    if (!bucketName) {
        throw new Error(
            'Storage bucket not configured. ' +
            'Please ensure FIREBASE_STORAGE_BUCKET is set in environment variables ' +
            'or the default bucket exists in Firebase Console.'
        );
    }

    console.log(`[Firebase Storage] Using bucket: ${bucketName}`);
    return getStorage(app).bucket(bucketName);
};

/**
 * Upload file to Firebase Storage
 * @param filePath - Destination path (e.g., 'assets/projects/image.jpg')
 * @param fileBuffer - File buffer
 * @param contentType - MIME type
 * @returns Public URL
 */
export async function uploadToStorage(
    filePath: string,
    fileBuffer: Buffer,
    contentType: string
): Promise<string> {
    const bucket = getBucket();
    const file = bucket.file(filePath);

    await file.save(fileBuffer, {
        contentType,
        metadata: {
            metadata: {
                firebaseStorageDownloadTokens: generateToken(),
            },
        },
    });

    // Make file public
    await file.makePublic();

    // Get public URL
    return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
}

/**
 * Delete file from Firebase Storage
 * @param filePath - Path to delete
 */
export async function deleteFromStorage(filePath: string): Promise<void> {
    const bucket = getBucket();
    const file = bucket.file(filePath);

    try {
        await file.delete();
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && (error as { code: number }).code === 404) {
            console.warn(`[Storage] File not found: ${filePath}`);
            return;
        }
        throw error;
    }
}

/**
 * Get public URL for file
 * @param filePath - Path in bucket
 * @returns Public URL
 */
export function getStorageUrl(filePath: string): string {
    const bucket = getBucket();
    return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
}

/**
 * Extract path from URL (for deletion)
 * @param url - Full URL
 * @returns Path or null
 */
export function extractStoragePath(url: string): string | null {
    try {
        const urlObj = new URL(url);
        // Format: https://storage.googleapis.com/BUCKET_NAME/PATH
        const parts = urlObj.pathname.split('/');
        if (parts.length < 2) return null;
        // Remove bucket name (first part)
        return parts.slice(2).join('/');
    } catch {
        return null;
    }
}

function generateToken(): string {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}

/**
 * List all files in a directory
 * @param prefix - Directory prefix (e.g., 'assets/projects/')
 */
export async function listStorageFiles(prefix: string): Promise<string[]> {
    const bucket = getBucket();
    const [files] = await bucket.getFiles({ prefix });
    return files.map(f => f.name);
}
