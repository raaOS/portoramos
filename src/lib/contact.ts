import { db } from '@/lib/firebaseAdmin';
import { ContactData } from '@/types/contact';

export async function getContactData(): Promise<ContactData | null> {
    try {
        const snap = await db.ref('content/contact').once('value');
        const data = snap.val() as ContactData;
        return data || null;
    } catch (error) {
        console.error('Error loading contact data from Firebase:', error);
        return null;
    }
}
