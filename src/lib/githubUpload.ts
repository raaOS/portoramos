/**
 * GitHub Upload Service
 * Handles uploading files to GitHub via the /api/upload/github endpoint.
 */

export interface HelperUploadResult {
    url: string;
    publicPath?: string;
    githubPath?: string;
}

const getCsrfToken = () => {
    if (typeof document === 'undefined') return '';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; csrf_token=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
};

export const uploadToGitHub = async (file: File): Promise<HelperUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload/github', {
        method: 'POST',
        headers: {
            'X-CSRF-Token': getCsrfToken()
        },
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || 'GitHub upload failed');
        } catch {
            throw new Error(errorText || 'GitHub upload failed');
        }
    }

    const data = await response.json();
    return {
        url: data.url,
        publicPath: data.publicPath,
        githubPath: data.githubPath
    };
};

/**
 * Delete a file from GitHub via the /api/upload/github endpoint.
 */
export const deleteFromGitHub = async (githubPath: string): Promise<boolean> => {
    try {
        const response = await fetch(`/api/upload/github?path=${encodeURIComponent(githubPath)}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-Token': getCsrfToken()
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('GitHub delete failed:', errorText);
            return false;
        }

        const data = await response.json();
        return data.success === true;
    } catch (error) {
        console.error('GitHub delete error:', error);
        return false;
    }
};

/**
 * Extracts the repository path from a GitHub raw user content URL.
 * Example: https://raw.githubusercontent.com/owner/repo/main/public/assets/file.png 
 * -> public/assets/file.png
 */
export const getGithubPathFromUrl = (url: string): string | null => {
    if (!url || !url.includes('raw.githubusercontent.com')) return null;

    try {
        const parts = url.split('/');
        // URL Format: https://raw.githubusercontent.com/ [0] owner [1] repo [2] branch [3] path... [4+]
        // parts[0] is '', parts[1] is '', parts[2] is 'raw.githubusercontent.com'
        // wait, split('/') on URL:
        // http: [0] / [1] /raw.githubusercontent.com [2] /owner [3] /repo [4] /branch [5] /path... [6+]

        // Correct splitting:
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(p => !!p);

        if (pathParts.length < 4) return null;

        // pathParts: [owner, repo, branch, ...path]
        return pathParts.slice(3).join('/');
    } catch {
        return null;
    }
};


