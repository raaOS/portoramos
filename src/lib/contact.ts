import { db } from '@/lib/firebaseAdmin';
import fallbackContactData from '@/data/contact.json';
import type { ContactData } from '@/types/contact';

const fallbackContact = fallbackContactData as ContactData;

function mergeContactData(data?: ContactData | null): ContactData {
    if (!data) return fallbackContact;

    const content = data.content
        ? {
            ...fallbackContact.content,
            ...data.content,
        }
        : fallbackContact.content;

    const info = {
        ...fallbackContact.info,
        ...data.info,
        socialMedia: {
            ...fallbackContact.info.socialMedia,
            ...data.info?.socialMedia,
        }
    };

    const formSettings = {
        ...fallbackContact.formSettings,
        ...data.formSettings,
        fields: {
            ...fallbackContact.formSettings.fields,
            ...data.formSettings?.fields,
        }
    };

    return {
        ...fallbackContact,
        ...data,
        content,
        info,
        formSettings
    };
}

export async function getContactData(): Promise<ContactData> {
    try {
        const snap = await db.ref('content/contact').once('value');
        const data = snap.val() as ContactData | null;
        return mergeContactData(data);
    } catch (error) {
        console.error('Error loading contact data from Firebase:', error);
        return fallbackContact;
    }
}
