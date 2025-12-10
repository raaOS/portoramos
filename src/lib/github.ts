import { Project } from '@/types/projects';

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
    private token: string;
    private owner: string;
    private repo: string;
    private path: string;

    constructor() {
        const token = process.env.GITHUB_ACCESS_TOKEN;
        const owner = process.env.GITHUB_OWNER;
        const repo = process.env.GITHUB_REPO;

        // Default path to the projects.json file in the repo
        // Assuming the structure is consistent with the current repo
        this.path = 'src/data/projects.json';

        if (!token || !owner || !repo) {
            console.error('Missing GitHub configuration');
        }

        this.token = token || '';
        this.owner = owner || '';
        this.repo = repo || '';
    }

    private getHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        };
    }

    /**
     * Fetch the current content and SHA of the projects.json file
     */
    async getFile(): Promise<{ content: { projects: Project[], lastUpdated: string }, sha: string }> {
        const url = `${GITHUB_API_URL}/repos/${this.owner}/${this.repo}/contents/${this.path}`;

        const response = await fetch(url, {
            headers: this.getHeaders(),
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        const data = (await response.json()) as GitHubFileResponse;
        const content = Buffer.from(data.content, 'base64').toString('utf-8');

        return {
            content: JSON.parse(content),
            sha: data.sha
        };
    }

    /**
     * Update the projects.json file on GitHub
     */
    async updateProjects({ projects, message }: UpdateFileParams): Promise<boolean> {
        try {
            // 1. Get current file to get the latest SHA (required for updates)
            const { sha } = await this.getFile();

            // 2. Prepare new content
            const newContent = JSON.stringify({
                projects,
                lastUpdated: new Date().toISOString()
            }, null, 2);

            const encodedContent = Buffer.from(newContent).toString('base64');

            // 3. Push commit
            const url = `${GITHUB_API_URL}/repos/${this.owner}/${this.repo}/contents/${this.path}`;

            const response = await fetch(url, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    message: message || 'Update projects via CMS',
                    content: encodedContent,
                    sha: sha, // Important to prevent overwrite conflicts
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('GitHub API Error:', error);
                throw new Error(`Failed to update file: ${response.statusText}`);
            }

            return true;
        } catch (error) {
            console.error('GitHub Service Error:', error);
            throw error;
        }
    }
}

export const githubService = new GitHubService();
