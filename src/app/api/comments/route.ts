import { NextRequest } from 'next/server';
import { validateAdminRequest } from '@/lib/auth';
import { db } from '@/lib/database';
import { validateCommentDepth } from '@/lib/validations';
import { success, badRequest, unauthorized, serverError, rateLimit } from '@/lib/api-response';
import { z } from 'zod';
import { sanitizeInput } from '@/lib/security/sanitization';

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

const newCommentSchema = z
  .object({
    id: z.string().min(1).max(100),
    text: z.string().min(1).max(1000),
    name: z.string().min(1).max(100),
    time: z.string().optional(),
    createdAt: z.string().optional(),
    likes: z.number().int().min(0).optional(),
  })
  .strict();

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
    return (
      settings?.bannedWords || [
        'judol',
        'slot',
        'gacor',
        'maxwin',
        'togel',
        'casino',
        'rtp',
        'pragmatic',
        'crypto',
        'bitcoin',
        'viagra',
        'bokep',
        'porn',
      ]
    );
  } catch (e) {
    console.warn(
      'Failed to load banned words from CLOUDFLARE_D1, using fallback',
      e instanceof Error ? e.message : e
    );
    return [
      'judol',
      'slot',
      'gacor',
      'maxwin',
      'togel',
      'casino',
      'rtp',
      'pragmatic',
      'crypto',
      'bitcoin',
      'viagra',
      'bokep',
      'porn',
    ];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, website_url } = body;
    const incomingComment =
      body.comment ?? (Array.isArray(body.comments) ? body.comments[0] : undefined);

    // --- 1. HONEYPOT VALIDATION ---
    if (website_url) {
      console.warn(`[API /comments POST] Honeypot triggered for slug ${slug}`);
      return badRequest('Spam detected');
    }

    if (!slug || !incomingComment) {
      return badRequest('Missing slug or comment');
    }

    // --- 2. VALIDATE COMMENT STRUCTURE WITH ZOD ---
    let commentToSave: Comment;
    try {
      const parsedComment = newCommentSchema.parse(incomingComment);
      commentToSave = {
        ...parsedComment,
        text: sanitizeInput(parsedComment.text),
        name: sanitizeInput(parsedComment.name),
        createdAt: parsedComment.createdAt || parsedComment.time || new Date().toISOString(),
        time: parsedComment.createdAt || parsedComment.time || new Date().toISOString(),
        likes: parsedComment.likes ?? 0,
        replies: [],
      };

      if (!validateCommentDepth(commentToSave)) {
        return badRequest('Comment nesting too deep (max 3 levels)');
      }
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return badRequest('Invalid comment structure', validationError.format());
      }
      throw validationError;
    }

    // --- 3. CONTENT MODERATION ---
    const bannedWords = await getBannedWords();
    const payloadString = JSON.stringify(commentToSave).toLowerCase();
    const foundBadWord = bannedWords.find((word) => payloadString.includes(word.toLowerCase()));

    if (foundBadWord) {
      return badRequest(`Comment contains restricted word: ${foundBadWord}`);
    }

    // --- 4. ATOMIC APPEND + FLOOD CONTROL ---
    const commentsRef = db.ref(`comments/${slug}`);
    let abortReason: 'flood' | null = null;

    const transactionResult = (await commentsRef.transaction((current: Comment[] | null) => {
      const existingComments = Array.isArray(current) ? current : [];
      const lastUserComment = existingComments[0];

      if (lastUserComment) {
        const isSameAuthor =
          lastUserComment.name === commentToSave.name ||
          lastUserComment.author === commentToSave.name;

        if (isSameAuthor) {
          const lastTimeStr = lastUserComment.createdAt || lastUserComment.time;
          if (lastTimeStr) {
            const timeDiff = Date.now() - new Date(lastTimeStr).getTime();
            if (timeDiff < 5000) {
              abortReason = 'flood';
              return;
            }
          }
        }
      }

      return [commentToSave, ...existingComments].slice(0, 1000);
    })) as { committed?: boolean };

    if (abortReason === 'flood' || transactionResult?.committed === false) {
      return rateLimit(5, 'Please wait 5 seconds before posting again');
    }

    return success({ comment: commentToSave });
  } catch (error) {
    console.error('[API /comments POST] Error:', error);
    return serverError('Failed to save comments');
  }
}

// Helper: Recursively remove comment/reply by ID
function removeCommentById(comments: Comment[], idToDelete: string): Comment[] {
  return (comments || [])
    .filter((c) => c.id !== idToDelete)
    .map((c) => ({
      ...c,
      replies: c.replies ? removeCommentById(c.replies, idToDelete) : [],
    }));
}

export async function DELETE(request: NextRequest) {
  if (!(await validateAdminRequest(request))) {
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
