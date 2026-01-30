import { Project } from '@/types/projects';
import { promises as fs } from 'fs';
import path from 'path';

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

export class GitHubService {
    private path: string = 'src/data/projects.json';

    // Lazy getters to ensure env vars are read at runtime, not build time
    private get token(): string {
        const token = process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN || '';
        // console.log('[GitHubService] Token length:', token.length); // Debug (don't log full token)
        if (!token) {
            console.error('[GitHubService] GITHUB_ACCESS_TOKEN or GITHUB_TOKEN is not set!');
            console.log('[GitHubService] Env keys:', Object.keys(process.env).filter(k => k.startsWith('GITHUB')));
        }
        return token;
    }

    private get owner(): string {
        const owner = process.env.GITHUB_OWNER || '';
        if (!owner) {
            console.error('[GitHubService] GITHUB_OWNER is not set!');
            console.log('[GitHubService] Env keys:', Object.keys(process.env)); // Debug all envs to see if they are loaded at all
        }
        return owner;
    }

    private get repo(): string {
        const repo = process.env.GITHUB_REPO || '';
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
     * Fetch file content from any path in the repo
     * @param noCache - If true, bypasses local file system and cache to get fresh data from GitHub (important for SHA)
     */
    async getFileContent<T>(filePath: string, noCache = false): Promise<{ content: T, sha: string }> {
        // If noCache is false, try reading from local filesystem first (Robust for Local Build)
        // BUT in Production, we want to use Next.js Data Cache (fetch) so we can revalidate it on-demand.
        // Local files in Vercel are static and won't reflect Admin updates until redeploy.
        if (!noCache && process.env.NODE_ENV === 'development') {
            try {
                const localPath = path.join(process.cwd(), filePath);
                // Check if file exists
                await fs.access(localPath);

                console.log(`[GitHubService] 📂 Reading local file: ${localPath}`);
                const content = await fs.readFile(localPath, 'utf-8');
                return {
                    content: JSON.parse(content),
                    sha: 'local-file-sha' // Dummy SHA, only for read-only mode
                };
            } catch (error) {
                // Determine if we should log warning
                if (process.env.NODE_ENV === 'development') {
                    console.warn(`[GitHubService] Local file read failed for ${filePath}, falling back to API.`);
                }
            }
        }

        const url = `${GITHUB_API_URL}/repos/${this.owner}/${this.repo}/contents/${filePath}`;
        console.log(`[GitHubService] Fetching: ${url} (noCache: ${noCache})`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        try {
            const response = await fetch(url, {
                headers: this.getHeaders(),
                cache: noCache ? 'no-store' : undefined,
                next: noCache ? undefined : { revalidate: 60 },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();

                // 404 is common when checking existence, suppress error log
                if (response.status === 404) {
                    // console.log(`[GitHubService] File not found (404): ${filePath}`);
                    throw new Error('Not Found');
                }

                console.error(`[GitHubService] GET failed: ${response.status} ${response.statusText}`, errorText);
                throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
            }

            const data = (await response.json()) as GitHubFileResponse;
            const content = Buffer.from(data.content, 'base64').toString('utf-8');

            return {
                content: JSON.parse(content),
                sha: data.sha
            };
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                console.error(`[GitHubService] Fetch timed out for ${filePath} after 5000ms`);
                throw new Error('Timeout');
            }
            throw error;
        }
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
                console.log(`[GitHubService] File ${filePath} not found, creating new.`);
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
            console.log(`[GitHubService] Updating: ${url}`);

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

                // Handle 422 Unprocessable Entity (Missing SHA for existing file)
                // This happens if we thought file didn't exist (getFileContent failed/404) but it actually does.
                if (response.status === 422 && retryCount < 2 && (error.message?.includes('sha') || error.message?.includes('SHA'))) {
                    console.warn(`[GitHubService] Missing SHA for existing file (422). Fetching SHA and retrying...`);
                    // Force fetch SHA, ignoring previous failure grounded assumption
                    try {
                        const fresh = await this.getFileContent(filePath, true);
                        if (fresh && fresh.sha) {
                            // Recursive retry works because next call will successfully get SHA from getFileContent
                            return this.updateFile(filePath, content, message, retryCount + 1);
                        }
                    } catch (e) {
                        console.error('[GitHubService] Failed to recover SHA for 422 retry:', e);
                    }
                }

                console.error('[GitHubService] PUT failed:', response.status, error);
                throw new Error(`GitHub API Error: ${response.status} - ${error.message || JSON.stringify(error)}`);
            }

            console.log('[GitHubService] Update successful!');
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
            console.log(`[GitHubService] Deleting: ${url}`);

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

            console.log(`[GitHubService] Deleted ${filePath}`);
            return true;
        } catch (error) {
            console.error('[GitHubService] Delete Error:', error);
            return false;
        }
    }
}

export const githubService = new GitHubService();
