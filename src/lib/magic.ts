/**
 * Magic Comment Generator
 * ======================
 * Menghasilkan komentar Gen-Z dan metrik viral untuk project portofolio.
 * Data ini bersifat dekoratif — tidak disimpan di database.
 *
 * @module magic
 */

export interface CommentReply {
  id?: string;
  text: string;
  name: string;
  time: string;
  createdAt?: string;
  likes: number;
  avatar?: string;
}

export interface Comment {
  id?: string;
  text: string;
  name: string;
  time?: string;
  createdAt?: string;
  likes: number;
  likedByMe?: boolean;
  replies: CommentReply[];
  avatar?: string;
}

export interface ViralMetrics {
  likes: number;
  shares: number;
}

interface Vibe {
  type: string;
  comments: string[];
  admin_replies: string[];
  user_replies: string[];
}

/**
 * Generates viral metrics for a project.
 * Likes: 5-45, Shares: 0-5 (randomized).
 */
export function generateViralMetrics(): ViralMetrics {
  return {
    likes: Math.floor(Math.random() * 41) + 5,
    shares: Math.floor(Math.random() * 6),
  };
}

/**
 * @deprecated Static mock templates have been removed. Use Real LLM API endpoints (/api/admin/projects/magic-complete) powered by OpenRouter / Gemini Free Tier.
 */
export const COMMENT_VIBES: Vibe[] = [];

/**
 * @deprecated Static mock comment generation is disabled.
 * All comment generation now uses Real LLM API endpoints (/api/admin/projects/magic-complete).
 */
export function generateGenZComments(
  _slug: string,
  _count?: number,
  _tone?: string,
  _includeReplies: boolean = true
): Comment[] {
  console.warn(
    '[Real AI Required] generateGenZComments offline mock is deprecated. Use Real LLM generation via /api/admin/projects/magic-complete.'
  );
  return [];
}
