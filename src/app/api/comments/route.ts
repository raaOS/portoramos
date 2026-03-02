import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { db } from '@/lib/firebaseAdmin';
import { commentSchema, validateCommentDepth } from '@/lib/validations/schemas';
import { success, badRequest, unauthorized, serverError, rateLimit } from '@/lib/api-response';
import { z } from 'zod';

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
            return success({ comments: snap.val() || [] });
        }

        const allSnap = await db.ref('comments').once('value');
        return success({ comments: allSnap.val() || {} });
    } catch (error) {
        console.error('[API /comments GET] Error:', error);
        return serverError('Failed to load comments');
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
            console.warn(`[API /comments POST] Honeypot triggered for slug ${slug}`);
            return badRequest('Spam detected');
        }

        if (!slug || !comments) {
            return badRequest('Missing slug or comments');
        }

        // --- 2. VALIDATE COMMENTS STRUCTURE WITH ZOD ---
        try {
            const commentArraySchema = z.array(commentSchema).max(1000, 'Too many comments');
            commentArraySchema.parse(comments);
            
            // Validate depth for nested replies
            for (const comment of comments) {
                if (!validateCommentDepth(comment)) {
                    return badRequest('Comment nesting too deep (max 3 levels)');
                }
            }
        } catch (validationError) {
            if (validationError instanceof z.ZodError) {
                return badRequest('Invalid comment structure', validationError.format());
            }
            throw validationError;
        }

        // --- 3. FLOOD CONTROL (RATE LIMITING) ---
        const existingSnap = await db.ref(`comments/${slug}`).limitToLast(1).once('value');
        const existingRaw: Comment[] = existingSnap.val() || [];

        if (Array.isArray(comments) && comments.length > 0) {
            const newLastComment = comments[comments.length - 1];
            const authorName = newLastComment.name || newLastComment.author;

            if (authorName && Array.isArray(existingRaw) && existingRaw.length > 0) {
                const lastUserComment = existingRaw[0];
                const isMatch = (lastUserComment.name === authorName) || (lastUserComment.author === authorName);

                if (isMatch) {
                    const lastTimeStr = lastUserComment.createdAt || lastUserComment.time;
                    if (lastTimeStr) {
                        const timeDiff = Date.now() - new Date(lastTimeStr).getTime();
                        if (timeDiff < 5000) {
                            return rateLimit(5, 'Please wait 5 seconds before posting again');
                        }
                    }
                }
            }
        }

        // --- 4. CONTENT MODERATION ---
        const bannedWords = await getBannedWords();
        const payloadString = JSON.stringify(comments).toLowerCase();
        const foundBadWord = bannedWords.find(word => payloadString.includes(word.toLowerCase()));

        if (foundBadWord) {
            return badRequest(`Comment contains restricted word: ${foundBadWord}`);
        }

        // --- 5. SAVE TO FIREBASE ---
        await db.ref(`comments/${slug}`).set(comments);

        return success({ comments });
    } catch (error) {
        console.error('[API /comments POST] Error:', error);
        return serverError('Failed to save comments');
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
        return unauthorized('Admin authentication required');
    }

    try {
        const body = await request.json();
        const { slug, commentId } = body;

        if (!slug || !commentId) {
            return badRequest('Missing slug or commentId');
        }

        const snap = await db.ref(`comments/${slug}`).once('value');
        const projectComments = snap.val() || [];
        const updatedComments = removeCommentById(projectComments, commentId);

        await db.ref(`comments/${slug}`).set(updatedComments);

        return success({ comments: updatedComments });
    } catch (error) {
        console.error('[API /comments DELETE] Error:', error);
        return serverError('Failed to delete comment');
    }
}
