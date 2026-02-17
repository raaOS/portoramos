import { loadData, saveData, ensureDataDir } from '@/lib/backup';
import { githubService } from '@/lib/github';
import path from 'path';

/**
 * Generic service to handle content storage (Local FS vs GitHub)
 */
export class ContentService<T> {
    private localPath: string;
    private githubPath: string;
    private fallbackData: T;

    constructor(filename: string, fallbackData: T) {
        // Standardize naming: file should be in src/data/
        this.localPath = path.join(process.cwd(), 'src', 'data', filename);
        this.githubPath = `src/data/${filename}`;
        this.fallbackData = fallbackData;
    }

    async getData(): Promise<T> {
        try {
            const isDev = process.env.NODE_ENV === 'development';
            let data: T | null = null;

            if (isDev) {
                await ensureDataDir();
                // Uses the existing backup/load logic that handles missing files gracefully
                data = (await loadData(this.localPath)) as T | null;
            } else {
                try {
                    const ghData = await githubService.getFileContent<T>(this.githubPath, true);
                    if (ghData && ghData.content) {
                        data = ghData.content;
                    }
                } catch (error) {
                    console.warn(`Failed to fetch ${this.githubPath} from GitHub, falling back to local/static:`, error);
                }
            }

            if (!data) {
                return this.fallbackData;
            }

            return data;
        } catch (error) {
            console.error(`Error loading data from ${this.localPath}:`, error);
            return this.fallbackData;
        }
    }

    async saveData(data: T, message: string): Promise<boolean> {
        const isDev = process.env.NODE_ENV === 'development';
        const hasGitHubToken = !!(process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN);

        // Always update local file in dev for immediate feedback/preview
        if (isDev) {
            await ensureDataDir();
            const localSuccess = await saveData(this.localPath, data);

            // If user wants avoiding "double work", we try to sync to GitHub even in dev
            if (hasGitHubToken && localSuccess) {
                try {
                    await githubService.updateFile(this.githubPath, data, message + ' (Dev Auto-Sync)');
                    console.log(`[ContentService] Auto-synced ${this.githubPath} to GitHub`);
                } catch (error) {
                    console.warn('[ContentService] Failed to auto-sync to GitHub in dev (continuing with local only):', error);
                }
            }
            return localSuccess;
        } else {
            // Production: GitHub only
            return await githubService.updateFile(this.githubPath, data, message + ' (via Admin CMS)');
        }
    }
}
