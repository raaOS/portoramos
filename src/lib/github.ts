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
        return {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        };
    }

    /**
     * Fetch file content from any path in the repo
     * @param noCache - If true, bypasses cache to get fresh data (important for SHA)
     */
    async getFileContent<T>(filePath: string, noCache = false): Promise<{ content: T, sha: string }> {
        // DEV MODE FALLBACK: Read from local filesystem
        if (process.env.NODE_ENV === 'development') {
            try {
                const localPath = path.join(process.cwd(), filePath);
                console.log(`[GitHubService] 🛠️ DEV MODE: Reading local file: ${localPath}`);
                const content = await fs.readFile(localPath, 'utf-8');
                return {
                    content: JSON.parse(content),
                    sha: 'dev-local-sha'
                };
            } catch (error) {
                console.warn(`[GitHubService] Local file read failed for ${filePath}, falling back to API.`);
            }
        }

        const url = `${GITHUB_API_URL}/repos/${this.owner}/${this.repo}/contents/${filePath}`;
        console.log(`[GitHubService] Fetching: ${url} (noCache: ${noCache})`);

        const response = await fetch(url, {
            headers: this.getHeaders(),
            cache: noCache ? 'no-store' : undefined,
            next: noCache ? undefined : { revalidate: 60 }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[GitHubService] GET failed: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as GitHubFileResponse;
        const content = Buffer.from(data.content, 'base64').toString('utf-8');

        return {
            content: JSON.parse(content),
            sha: data.sha
        };
    }

    /**
     * Update any file in the repo
     */
    /**
     * Update any file in the repo
     */
    async updateFile(filePath: string, content: any, message: string): Promise<boolean> {
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
            const newContent = JSON.stringify(content, null, 2);
            const encodedContent = Buffer.from(newContent).toString('base64');

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
}

export const githubService = new GitHubService();
