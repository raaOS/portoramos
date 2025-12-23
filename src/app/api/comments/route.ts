import { NextRequest, NextResponse } from 'next/server';
import { loadData, saveData, ensureDataDir } from '@/lib/backup';
import { githubService } from '@/lib/github';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'comments.json');
const GITHUB_PATH = 'src/data/comments.json'; // Relative path in repo

interface Comment {
    id: string;
    text: string;
    author: string;
    time: string;
    likes: number;
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
        const { slug, comments } = body;

        if (!slug || !comments) {
            return NextResponse.json(
                { error: 'Missing slug or comments' },
                { status: 400 }
            );
        }

        // --- CONTENT MODERATION ---
        // Validate the NEWEST comment (usually the last one added or check all)
        // Since the client sends the WHOLE array, we should check the content of the payload.
        // It's expensive to check everything, but safe.
        // Or better: Just check if the payload string contains banned words before saving.

        const bannedWords = await getBannedWords();

        const payloadString = JSON.stringify(comments).toLowerCase();
        const foundBadWord = bannedWords.find(word => payloadString.includes(word.toLowerCase()));

        if (foundBadWord) {
            return NextResponse.json(
                { error: `Comment contains restricted word: ${foundBadWord}` },
                { status: 400 }
            );
        }
        // ---------------------------

        // Fetch current data first to append/merge
        // But since we are updating the entire list for a slug (to handle likes/replies state management on client easier),
        // we will replace the list for this slug. 
        // CAUTION: This causes race conditions if multiple users comment on same project exactly at same time.
        // For a portfolio, this risk is acceptable.

        const isDev = process.env.NODE_ENV === 'development';
        let currentData = await getCommentsData();

        // Update data
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
