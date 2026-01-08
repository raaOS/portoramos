import { NextRequest, NextResponse } from 'next/server';
import { loadData, saveData, ensureDataDir } from '@/lib/backup';
import { githubService } from '@/lib/github';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'comments.json');
const GITHUB_PATH = 'src/data/comments.json'; // Relative path in repo

interface Comment {
    id: string;
    text?: string;    // Legacy/Backend
    comment?: string; // Frontend payload uses 'comment'
    author?: string;  // Legacy/Backend
    name?: string;    // Frontend uses this
    time?: string;    // Legacy
    createdAt?: string; // Frontend uses this
    likes?: number;
    likedByMe?: boolean;
    replies?: Comment[];
}

interface CommentsData {
    comments: Record<string, Comment[]>;
}

async function getCommentsData(): Promise<CommentsData> {
    const isDev = process.env.NODE_ENV === 'development';
    let data: CommentsData | null = null;

    // 1. Dev: Local FS
    if (isDev) {
        await ensureDataDir();
        data = (await loadData(DATA_FILE)) as CommentsData | null;
    }
    // 2. Prod: GitHub
    else {
        try {
            const ghData = await githubService.getFileContent<CommentsData>(GITHUB_PATH);
            data = ghData.content;
        } catch (error) {
            console.warn('Failed to fetch comments from GitHub:', error);
        }
    }

    if (!data) {
        data = { comments: {} };
    }
    return data;
}

export async function GET(request: NextRequest) {
    try {
        const data = await getCommentsData();
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');

        if (slug) {
            return NextResponse.json({
                comments: data.comments[slug] || []
            });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error loading comments:', error);
        return NextResponse.json({ comments: {} });
    }
}

// Helper to load banned words dynamically
async function getBannedWords(): Promise<string[]> {
    try {
        const isDev = process.env.NODE_ENV === 'development';
        let settings: any = null;

        // We reuse the logic or fetch internally? 
        // Better to duplicate simple load logic to avoid circular imports or relative path hell in Next.js api routes
        const settingsPath = path.join(process.cwd(), 'src', 'data', 'settings.json');

        if (isDev) {
            settings = await loadData(settingsPath);
        } else {
            const ghData = await githubService.getFileContent('src/data/settings.json');
            settings = ghData.content;
        }

        return settings?.bannedWords || [];
    } catch (e) {
        console.warn('Failed to load banned words, using fallback', e);
        return ['judol', 'slot']; // Fallback minimum
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { slug, comments, website_url } = body;

        // --- 1. HONEYPOT VALIDATION ---
        if (website_url) {
            console.warn(`Honeypot triggered for slug ${slug}`);
            return NextResponse.json(
                { error: 'Spam detected' },
                { status: 400 }
            );
        }

        if (!slug || !comments) {
            return NextResponse.json(
                { error: 'Missing slug or comments' },
                { status: 400 }
            );
        }

        // --- 2. FLOOD CONTROL (RATE LIMITING) ---
        // Verify against SERVER data, not the payload
        let currentData = await getCommentsData();
        const existingRaw = currentData.comments[slug] || [];

        // Identify the *new* comment to determine Author
        if (Array.isArray(comments) && comments.length > 0) {
            const newLastComment = comments[comments.length - 1];
            const authorName = newLastComment.name || newLastComment.author;

            if (authorName) {
                // Find last comment by THIS author in the existing DB
                // Search backwards for performance
                let lastUserComment = null;
                for (let i = existingRaw.length - 1; i >= 0; i--) {
                    const c = existingRaw[i];
                    if ((c.name === authorName) || (c.author === authorName)) {
                        lastUserComment = c;
                        break;
                    }
                }

                if (lastUserComment) {
                    const lastTimeStr = lastUserComment.createdAt || lastUserComment.time;
                    if (lastTimeStr) {
                        const lastDate = new Date(lastTimeStr);
                        if (!isNaN(lastDate.getTime())) {
                            const timeDiff = Date.now() - lastDate.getTime();
                            // Limit: 5 seconds per user
                            if (timeDiff < 5000) {
                                return NextResponse.json(
                                    { error: 'Please wait 5 seconds before posting again.' },
                                    { status: 429 }
                                );
                            }
                        }
                    }
                }
            }
        }

        // --- 3. CONTENT MODERATION ---
        const bannedWords = await getBannedWords();
        const payloadString = JSON.stringify(comments).toLowerCase();
        const foundBadWord = bannedWords.find(word => payloadString.includes(word.toLowerCase()));

        if (foundBadWord) {
            return NextResponse.json(
                { error: `Comment contains restricted word: ${foundBadWord}` },
                { status: 400 }
            );
        }

        // --- 4. SAVE ---
        const isDev = process.env.NODE_ENV === 'development';

        // Update data (currentData was already loaded above)
        currentData.comments[slug] = comments;

        // Save
        if (isDev) {
            await ensureDataDir();
            const success = await saveData(DATA_FILE, currentData);
            if (!success) throw new Error('Failed to save to local filesystem');
        } else {
            const success = await githubService.updateFile(GITHUB_PATH, currentData, `Update comments for ${slug}`);
            if (!success) throw new Error('Failed to save to GitHub');
        }

        return NextResponse.json({ success: true, comments: comments });
    } catch (error) {
        console.error('Error saving comments:', error);
        return NextResponse.json(
            { error: 'Failed to save comments' },
            { status: 500 }
        );
    }
}

// Helper: Recursively remove comment/reply by ID
function removeCommentById(comments: Comment[], idToDelete: string): Comment[] {
    return comments
        .filter(c => c.id !== idToDelete)
        .map(c => ({
            ...c,
            replies: c.replies ? removeCommentById(c.replies, idToDelete) : []
        }));
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { slug, commentId } = body;

        if (!slug || !commentId) {
            return NextResponse.json(
                { error: 'Missing slug or commentId' },
                { status: 400 }
            );
        }

        const isDev = process.env.NODE_ENV === 'development';
        let currentData = await getCommentsData();

        const projectComments = currentData.comments[slug] || [];
        const updatedComments = removeCommentById(projectComments, commentId);

        currentData.comments[slug] = updatedComments;

        // Save
        if (isDev) {
            await ensureDataDir();
            const success = await saveData(DATA_FILE, currentData);
            if (!success) throw new Error('Failed to save to local filesystem');
        } else {
            const success = await githubService.updateFile(GITHUB_PATH, currentData, `Delete comment ${commentId} on ${slug}`);
            if (!success) throw new Error('Failed to save to GitHub');
        }

        return NextResponse.json({ success: true, comments: updatedComments });
    } catch (error) {
        console.error('Error deleting comment:', error);
        return NextResponse.json(
            { error: 'Failed to delete comment' },
            { status: 500 }
        );
    }
}
