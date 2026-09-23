import type { Comment } from '@/lib/magic';
import { getGeminiApiKey, getOpenRouterApiKey } from '../../../ai/_shared';
import {
  fetchLocalMediaAsBase64,
  fetchRemoteMediaAsBase64,
  parseInlineBase64,
} from '../../../ai/media-helper';
import { buildCommentPrompt } from './commentPrompt';
import { fetchGeminiComments, fetchOpenRouterComments } from './commentAiCallers';
import { parseAndFormatAiComments } from './commentFormatters';

export async function generateAiCommentsWithFallback(params: {
  slug: string;
  count: number;
  tone: string;
  reply: boolean;
  projectTitle?: string;
  projectDescription?: string;
  cover?: string;
  imageBase64?: string;
  reqUrl: string;
}): Promise<Comment[]> {
  const geminiApiKey = getGeminiApiKey();
  const openRouterApiKey = getOpenRouterApiKey();

  if (!geminiApiKey && !openRouterApiKey) {
    throw new Error(
      'API Key AI (Gemini atau OpenRouter) belum dikonfigurasi. Mohon pasang API Key di .env.local untuk menggunakan Real AI.'
    );
  }

  try {
    // 1. Process cover image/video if available
    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (params.imageBase64) {
      const parsedInline = parseInlineBase64(params.imageBase64);
      base64Data = parsedInline.base64Data;
      mimeType = parsedInline.mimeType;
    } else if (params.cover) {
      try {
        let resolvedCover = params.cover;
        const isVideo = resolvedCover.endsWith('.mp4') || resolvedCover.endsWith('.webm');
        if (isVideo) {
          resolvedCover = resolvedCover.replace(/\.(mp4|webm)(\?.*)?$/i, '.jpg');
        }

        if (
          resolvedCover.startsWith('/r2/') ||
          resolvedCover.startsWith('r2/') ||
          resolvedCover.startsWith('/assets/') ||
          resolvedCover.startsWith('assets/')
        ) {
          const localMedia = await fetchLocalMediaAsBase64(resolvedCover, params.reqUrl);
          base64Data = localMedia.base64Data;
          mimeType = localMedia.mimeType;
        } else if (resolvedCover.startsWith('http')) {
          const remoteMedia = await fetchRemoteMediaAsBase64(resolvedCover);
          base64Data = remoteMedia.base64Data;
          mimeType = remoteMedia.mimeType;
        }
      } catch (err) {
        console.warn('[AI Comments] Failed to download cover media:', err);
      }
    }

    // 2. Prepare Prompt
    const hasMedia = !!base64Data;
    const prompt = buildCommentPrompt({
      count: params.count,
      tone: params.tone,
      reply: params.reply,
      projectTitle: params.projectTitle,
      projectDescription: params.projectDescription,
      hasMedia,
    });

    let text = '';

    // Provider 1: Gemini
    if (geminiApiKey) {
      text = await fetchGeminiComments(geminiApiKey, prompt, base64Data, mimeType);
    }

    // Provider 2: OpenRouter fallback
    if (!text && openRouterApiKey) {
      text = await fetchOpenRouterComments(openRouterApiKey, prompt, base64Data, mimeType);
    }

    if (!text) {
      throw new Error('AI providers returned empty or failed to respond');
    }

    return parseAndFormatAiComments(text, params.slug);
  } catch (err) {
    console.error('[AI Comments] AI Generation failed:', err);
    throw err instanceof Error ? err : new Error('Gagal memproses Real AI generation');
  }
}
