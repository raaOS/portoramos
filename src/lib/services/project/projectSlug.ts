import { db } from '@/lib/database';

export async function generateUniqueSlug(title: string): Promise<string> {
  const MAX_TITLE_LENGTH = 200;
  const truncatedTitle = title.substring(0, MAX_TITLE_LENGTH);
  const baseSlug = truncatedTitle
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 50);

  let slug = baseSlug;
  let attempts = 0;
  const MAX_ATTEMPTS = 5;

  while (attempts < MAX_ATTEMPTS) {
    const projectsSnap = await db.ref('projects').orderByChild('slug').equalTo(slug).once('value');
    if (!projectsSnap.exists()) {
      break;
    }

    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    slug = `${baseSlug}-${timestamp}${random}`;
    attempts++;

    console.log(`[ProjectService] Slug collision detected, retrying with: ${slug}`);
  }

  if (attempts >= MAX_ATTEMPTS) {
    throw new Error('Failed to generate unique slug after maximum attempts');
  }

  return slug;
}
