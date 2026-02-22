import { Project } from '@/types/projects';
import { promises as fs } from 'fs';
import path from 'path';
import { unstable_cache } from 'next/cache';
import { revalidateTag, revalidatePath } from 'next/cache';

const GITHUB_API_URL = 'https://api.github.com';

interface GitHubFileResponse {
    content: string;
    sha: string;
    encoding: string;
}

interface UpdateFileParams {
    projects: Project[];
    message: string;
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

export class GitHubService {
    private path: string = 'src/data/projects.json';
    private lastCallTime: number = 0;
    private readonly MIN_INTERVAL: number = 1000; // 1 second between API calls

    // Lazy getters to ensure env vars are read at runtime, not build time
    private get token(): string {
        const token = cleanEnvVar('GITHUB_ACCESS_TOKEN') || cleanEnvVar('GITHUB_TOKEN') || '';
        // console.log('[GitHubService] Token length:', token.length); // Debug (don't log full token)
        if (!token) {
            console.error('[GitHubService] GITHUB_ACCESS_TOKEN or GITHUB_TOKEN is not set!');
            // Token missing - error already logged above
        }
        return token;
    }

    private get owner(): string {
        const owner = cleanEnvVar('GITHUB_OWNER') || '';
        if (!owner) {
            console.error('[GitHubService] GITHUB_OWNER is not set!');
            // Owner missing - error already logged above
        }
        return owner;
    }

    private get repo(): string {
        const repo = cleanEnvVar('GITHUB_REPO') || '';
        if (!repo) {
            console.error('[GitHubService] GITHUB_REPO is not set!');
        }
        return repo;
    }

    private getHeaders() {
        const headers: Record<string, string> = {
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    /**
     * Rate-limited fetch wrapper for GitHub API
     */
    private async rateLimitedFetch(url: string, options?: RequestInit) {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastCallTime;

        if (timeSinceLastCall < this.MIN_INTERVAL) {
            await new Promise(resolve =>
                setTimeout(resolve, this.MIN_INTERVAL - timeSinceLastCall)
            );
        }

        this.lastCallTime = Date.now();

        const response = await fetch(url, {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options?.headers,
            },
        });

        // Check rate limit headers
        const remaining = response.headers.get('X-RateLimit-Remaining');
        const reset = response.headers.get('X-RateLimit-Reset');

        if (remaining === '0') {
            const resetTime = new Date(parseInt(reset || '0') * 1000);
            console.warn(`[GitHubService] ⚠️ Rate limit exceeded. Resets at ${resetTime}`);
        }

        return response;
    }

    /**
     * Fetch file content from any path in the repo
     * @param noCache - If true, bypasses local file system and cache to get fresh data from GitHub (important for SHA)
     */
    async getFileContent<T>(filePath: string, noCache = false): Promise<{ content: T, sha: string }> {
        // If noCache is false, try reading from local filesystem first (Robust for Local Build)
        if (!noCache && process.env.NODE_ENV === 'development') {
            try {
                const localPath = path.join(process.cwd(), filePath);
                await fs.access(localPath);
                const content = await fs.readFile(localPath, 'utf-8');
                return {
                    content: JSON.parse(content),
                    sha: 'local-file-sha'
                };
            } catch (error) {
                if (process.env.NODE_ENV === 'development') {
                    console.warn(`[GitHubService] Local file read failed for ${filePath}, falling back to API.`);
                }
            }
        }

        // Define the internal fetch function for unstable_cache
        const fetchContent = async (path: string, fresh = false) => {
            const url = `${GITHUB_API_URL}/repos/${this.owner}/${this.repo}/contents/${path}`;
            // Fetching from GitHub API

            const response = await this.rateLimitedFetch(url, {
                // IMPORTANT: During SSG, 'no-store' causes a bailout.
                // We use 'force-cache' for the background fetch when noCache=false (wrapped in unstable_cache)
                // and 'no-store' only when explicit fresh data is requested (e.g. for SHA in updates).
                cache: fresh ? 'no-store' : 'force-cache',
            });

            if (!response.ok) {
                if (response.status === 404) throw new Error('Not Found');
                throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
            }

            const data = (await response.json()) as GitHubFileResponse;
            const content = Buffer.from(data.content, 'base64').toString('utf-8');

            return {
                content: JSON.parse(content) as T,
                sha: data.sha
            };
        };

        if (noCache) {
            return fetchContent(filePath, true);
        }

        // Determine tag based on path
        const tag = filePath.includes('projects.json') ? 'projects' :
            filePath.includes('comments.json') ? 'comments' : 'github-content';

        // Wrap with unstable_cache for production performance
        const cachedFetch = unstable_cache(
            async (path: string) => fetchContent(path, false),
            [`github-file-${filePath}`],
            {
                revalidate: 600, // 10 minutes
                tags: [tag]
            }
        );

        return cachedFetch(filePath);
    }

    /**
     * Update any file in the repo
     */
    /**
     * Update any file in the repo
     */
    async updateFile(filePath: string, content: any, message: string, retryCount = 0): Promise<boolean> {
        try {
            // 1. Get current file to get the latest SHA (required for updates)
            let sha: string | undefined;
            try {
                // IMPORTANT: Use noCache=true to get the LATEST SHA and avoid 409 conflicts
                const current = await this.getFileContent(filePath, true);
                sha = current.sha;
            } catch (e) {
                // File might not exist yet, which is fine for creation
                // File not found, creating new
            }

            // 2. Prepare new content
            let encodedContent: string;
            if (Buffer.isBuffer(content)) {
                encodedContent = content.toString('base64');
            } else if (typeof content === 'string') {
                encodedContent = Buffer.from(content).toString('base64');
            } else {
                const newContent = JSON.stringify(content, null, 2);
                encodedContent = Buffer.from(newContent).toString('base64');
            }

            // 3. Push commit
            const url = `${GITHUB_API_URL}/repos/${this.owner}/${this.repo}/contents/${filePath}`;
            // Updating file via GitHub API

            const body: { message: string; content: string; sha?: string } = {
                message: message,
                content: encodedContent,
            };
            if (sha) body.sha = sha;

            const response = await fetch(url, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.json();

                // Handle 409 Conflict (SHA mismatch) with a retry
                if (response.status === 409 && retryCount < 2) {
                    console.warn(`[GitHubService] Conflict (409) detected for ${filePath}. Retrying (${retryCount + 1}/2)...`);
                    await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
                    return this.updateFile(filePath, content, message, retryCount + 1);
                }

                // Handle 422 Unprocessable Entity
                if (response.status === 422 && retryCount < 2 && (error.message?.includes('sha') || error.message?.includes('SHA'))) {
                    console.warn(`[GitHubService] Missing SHA for existing file (422). Fetching SHA and retrying...`);
                    try {
                        const fresh = await this.getFileContent(filePath, true);
                        if (fresh && fresh.sha) {
                            return this.updateFile(filePath, content, message, retryCount + 1);
                        }
                    } catch (e) {
                        console.error('[GitHubService] Failed to recover SHA for 422 retry:', e);
                    }
                }

                console.error('[GitHubService] PUT failed:', response.status, error);
                throw new Error(`GitHub API Error: ${response.status} - ${error.message || JSON.stringify(error)}`);
            }

            // Burst cache after success
            const tag = filePath.includes('projects.json') ? 'projects' :
                filePath.includes('comments.json') ? 'comments' : 'github-content';
            revalidateTag(tag, 'max');
            revalidatePath('/', 'layout'); // Fallback revalidation

            // Update successful, cache revalidated
            return true;
        } catch (error) {
            console.error('[GitHubService] Error:', error);
            throw error;
        }
    }

    /**
     * Fetch the current content and SHA of the projects.json file
     * @param noCache - If true, bypasses cache
     */
    async getFile(noCache = false): Promise<{ content: { projects: Project[], lastUpdated: string }, sha: string }> {
        return this.getFileContent(this.path, noCache);
    }

    /**
     * Update the projects.json file on GitHub
     */
    async updateProjects({ projects, message }: UpdateFileParams): Promise<boolean> {
        const content = {
            projects,
            lastUpdated: new Date().toISOString()
        };
        return this.updateFile(this.path, content, message);
    }

    /**
     * Update the gallery-featured.json file on GitHub
     */
    async updateGallery(featuredProjectIds: string[], message: string): Promise<boolean> {
        const content = {
            featuredProjectIds,
            lastUpdated: new Date().toISOString()
        };
        return this.updateFile('src/data/gallery-featured.json', content, message);
    }

    /**
     * Delete a file from the repo
     */
    async deleteFile(filePath: string, message: string): Promise<boolean> {
        try {
            // 1. Get current SHA
            let sha: string;
            try {
                const current = await this.getFileContent(filePath, true);
                sha = current.sha;
            } catch (e) {
                console.warn(`[GitHubService] File ${filePath} not found, skipping delete.`);
                return true; // File doesn't exist, mission accomplished
            }

            const url = `${GITHUB_API_URL}/repos/${this.owner}/${this.repo}/contents/${filePath}`;
            // Deleting file via GitHub API

            const response = await fetch(url, {
                method: 'DELETE',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    message,
                    sha
                })
            });

            if (!response.ok) {
                // 404 is fine (already deleted, though getFileContent check covers this mostly)
                if (response.status === 404) return true;

                const error = await response.json();
                console.error('[GitHubService] DELETE failed:', response.status, error);
                throw new Error(`GitHub API Error: ${response.status}`);
            }

            // File deleted successfully
            return true;
        } catch (error) {
            console.error('[GitHubService] Delete Error:', error);
            return false;
        }
    }
}

export const githubService = new GitHubService();
