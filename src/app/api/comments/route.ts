import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { db } from '@/lib/firebaseAdmin';

interface Comment {
    id: string;
    text?: string;
    comment?: string;
    author?: string;
    name?: string;
    time?: string;
    createdAt?: string;
    likes?: number;
    likedByMe?: boolean;
    replies?: Comment[];
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');

        if (slug) {
            const snap = await db.ref(`comments/${slug}`).once('value');
            return NextResponse.json({
                comments: snap.val() || []
            });
        }

        const allSnap = await db.ref('comments').once('value');
        return NextResponse.json({ comments: allSnap.val() || {} });
    } catch (error) {
        console.error('Error loading comments from Firebase:', error instanceof Error ? error.message : error);
        return NextResponse.json({
            error: 'Failed to load comments',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

async function getBannedWords(): Promise<string[]> {
    try {
        const snap = await db.ref('settings/bannedWords').once('value');
        if (snap.exists()) return snap.val();

        // Try getting from root settings if not in subpath
        const rootSnap = await db.ref('settings').once('value');
        const settings = rootSnap.val();
        return settings?.bannedWords || ['judol', 'slot'];
    } catch (e) {
        console.warn('Failed to load banned words from Firebase, using fallback', e instanceof Error ? e.message : e);
        return ['judol', 'slot'];
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { slug, comments, website_url } = body;

        // --- 1. HONEYPOT VALIDATION ---
        if (website_url) {
            console.warn(`Honeypot triggered for slug ${slug}`);
            return NextResponse.json({ error: 'Spam detected' }, { status: 400 });
        }

        if (!slug || !comments) {
            return NextResponse.json({ error: 'Missing slug or comments' }, { status: 400 });
        }

        // --- 2. FLOOD CONTROL (RATE LIMITING) ---
        const existingSnap = await db.ref(`comments/${slug}`).limitToLast(1).once('value');
        const existingRaw: Comment[] = existingSnap.val() || [];

        if (Array.isArray(comments) && comments.length > 0) {
            const newLastComment = comments[comments.length - 1];
            const authorName = newLastComment.name || newLastComment.author;

            if (authorName && Array.isArray(existingRaw) && existingRaw.length > 0) {
                const lastUserComment = existingRaw[0]; // limitToLast(1) returns array with 1 elem or object
                const isMatch = (lastUserComment.name === authorName) || (lastUserComment.author === authorName);

                if (isMatch) {
                    const lastTimeStr = lastUserComment.createdAt || lastUserComment.time;
                    if (lastTimeStr) {
                        const timeDiff = Date.now() - new Date(lastTimeStr).getTime();
                        if (timeDiff < 5000) {
                            return NextResponse.json({ error: 'Please wait 5 seconds before posting again.' }, { status: 429 });
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
            return NextResponse.json({ error: `Comment contains restricted word: ${foundBadWord}` }, { status: 400 });
        }

        // --- 4. SAVE TO FIREBASE ---
        await db.ref(`comments/${slug}`).set(comments);

        return NextResponse.json({ success: true, comments: comments });
    } catch (error) {
        console.error('Error saving comments to Firebase:', error instanceof Error ? error.message : error);
        return NextResponse.json({
            error: 'Failed to save comments',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Helper: Recursively remove comment/reply by ID
function removeCommentById(comments: Comment[], idToDelete: string): Comment[] {
    return (comments || [])
        .filter(c => c.id !== idToDelete)
        .map(c => ({
            ...c,
            replies: c.replies ? removeCommentById(c.replies, idToDelete) : []
        }));
}

export async function DELETE(request: NextRequest) {
    if (!checkAdminAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { slug, commentId } = body;

        if (!slug || !commentId) {
            return NextResponse.json({ error: 'Missing slug or commentId' }, { status: 400 });
        }

        const snap = await db.ref(`comments/${slug}`).once('value');
        const projectComments = snap.val() || [];
        const updatedComments = removeCommentById(projectComments, commentId);

        await db.ref(`comments/${slug}`).set(updatedComments);

        return NextResponse.json({ success: true, comments: updatedComments });
    } catch (error) {
        console.error('Error deleting comment from Firebase:', error instanceof Error ? error.message : error);
        return NextResponse.json({
            error: 'Failed to delete comment',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
