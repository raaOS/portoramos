import path from 'path';
import { loadData, ensureDataDir } from '@/lib/backup';
import { ContactData } from '@/types/contact';
import { githubService } from '@/lib/github';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'contact.json');
const GITHUB_PATH = 'src/data/contact.json';

export async function getContactData(): Promise<ContactData | null> {
    const isDev = process.env.NODE_ENV === 'development';
    let data: ContactData | null = null;

    try {
        if (isDev) {
            await ensureDataDir();
            data = await loadData(DATA_FILE) as ContactData;
        } else {
            // Fallback or specific logic if needed for GitHub fetch
            try {
                const ghData = await githubService.getFileContent<ContactData>(GITHUB_PATH, true);
                data = ghData.content;
            } catch (e) {
                console.warn('Failed to fetch contact from GitHub via LIB, falling back or returning null', e);
            }
        }
    } catch (error) {
        console.error('Error loading contact data in lib:', error);
    }

    return data;
}
