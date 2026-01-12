/**
 * GitHub Upload Service
 * Handles uploading files to GitHub via the /api/upload/github endpoint.
 */

export interface HelperUploadResult {
    url: string;
    publicPath?: string;
    githubPath?: string;
}

export const uploadToGitHub = async (file: File): Promise<HelperUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload/github', {
        method: 'POST',
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
