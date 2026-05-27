import { db } from '@/lib/database';
import { CacheManager } from '@/lib/cache/CacheManager';
import fallbackContactData from '@/data/contact.json';
import type { ContactData } from '@/types/contact';

const fallbackContact = fallbackContactData as ContactData;
const CONTACT_CACHE_KEY = 'content:contact';
const contactCache = new CacheManager({
  defaultTTL: 30_000,
  maxSize: 5,
  label: 'ContactData',
});

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
    },
  };

  const formSettings = {
    ...fallbackContact.formSettings,
    ...data.formSettings,
    fields: {
      ...fallbackContact.formSettings.fields,
      ...data.formSettings?.fields,
    },
  };

  return {
    ...fallbackContact,
    ...data,
    content,
    info,
    formSettings,
  };
}

export function invalidateContactCache() {
  contactCache.delete(CONTACT_CACHE_KEY);
}

export function clearContactCache() {
  const entriesCleared = contactCache.size;
  contactCache.clear();
  return entriesCleared;
}

export async function getContactData(noCache = false): Promise<ContactData> {
  if (!noCache) {
    const cached = contactCache.get<ContactData>(CONTACT_CACHE_KEY);
    if (cached) return cached;
  }

  try {
    const snap = await db.ref('content/contact').once('value');
    const data = snap.val() as ContactData | null;
    const merged = mergeContactData(data);
    contactCache.set(CONTACT_CACHE_KEY, merged);
    return merged;
  } catch (error) {
    console.error('Error loading contact data from data backend:', error);
    return fallbackContact;
  }
}
