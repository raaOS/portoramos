import { NextRequest, NextResponse } from 'next/server';
import { generateViralMetrics } from '@/lib/magic';
import type { Comment } from '@/lib/magic';
import { validateAdminRequest } from '@/lib/auth';
import { getGeminiApiKey, getOpenRouterApiKey } from '../../../ai/_shared';
import {
  fetchLocalMediaAsBase64,
  fetchRemoteMediaAsBase64,
  parseInlineBase64,
} from '../../../ai/media-helper';

async function sleep(ms: number) {
  if (process.env.NODE_ENV === 'test') return;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
    throw new Error('API Key AI (Gemini atau OpenRouter) belum dikonfigurasi. Mohon pasang API Key di .env.local untuk menggunakan Real AI.');
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
        // Do not crash, proceed with text-only prompt
      }
    }

    // 2. Prepare Prompt
    const hasMedia = !!base64Data;
    const toneDescription =
      params.tone === 'tech'
        ? 'Teknis & Mendalam — komentar berisi pertanyaan atau observasi soal teknologi, arsitektur, performa, atau detail teknis yang terlihat.'
        : params.tone === 'aesthetic'
          ? 'Estetik & Visual — komentar membahas elemen visual spesifik: warna, tipografi, layout, spacing, animasi, atau komposisi yang terlihat di gambar/video.'
          : 'Kasual & Santai — bahasa sehari-hari anak muda Indonesia, tapi tetap sopan dan spesifik. Hindari slang berlebihan.';

    const mediaInstruction = hasMedia
      ? `PENTING — GAMBAR/VIDEO TERLAMPIR:
        Kamu DIBERIKAN gambar atau screenshot dari proyek ini. Setiap komentar WAJIB menyebut sesuatu yang benar-benar terlihat di gambar tersebut (misalnya: elemen UI spesifik, warna dominan, layout, ikon, teks yang terlihat, atau fitur visual tertentu). Jangan mengarang hal yang tidak ada di gambar.`
      : `Tidak ada gambar yang diberikan. Buat komentar berdasarkan judul dan deskripsi proyek saja — tetap spesifik dan tidak generik.`;

    const prompt = `Kamu adalah sekelompok pengunjung berbeda yang melihat karya portofolio web developer/desainer.

PROYEK:
- Judul: "${params.projectTitle || 'Proyek Kreatif'}"
- Deskripsi: "${params.projectDescription || 'Tidak ada deskripsi'}"

${mediaInstruction}

TUGAS:
Buat tepat ${params.count} komentar dalam Bahasa Indonesia yang terasa seperti komentar asli dari orang-orang berbeda.

TONE: "${params.tone}" → ${toneDescription}

ATURAN WAJIB:
1. Setiap komentar HARUS menyebut detail spesifik dari proyek (bukan pujian generik).
   - BURUK: "Keren banget!", "Gak ada obat!", "PC NASA sih ini"
   - BAIK: "Navbar-nya clean banget, glassmorphism-nya subtle pas", "Warna gradien biru ke ungu di hero section itu cocok sama vibe-nya"
2. Gunakan bahasa natural seperti orang sungguhan — JANGAN hiperbola atau lebay.
3. Emoji maksimal 1 per komentar, dan tidak wajib.
4. Setiap komentator punya nama Indonesia yang unik, acak, dan bervariasi dari project ke project (hindari pengulangan nama yang sama seperti Rizky, Dinda, Bagas terus-menerus).
5. JANGAN ada 2 komentar dengan pola kalimat yang mirip.
6. Variasikan panjang komentar: ada yang 1 kalimat pendek, ada yang 2 kalimat.
${params.reply ? `
BALASAN:
- Untuk setiap komentar, buat 1 balasan dari "Ramos" (pemilik portofolio).
- Balasan harus SPESIFIK merespons isi komentar tersebut — bukan template seperti "Makasih!" atau "Thanks!".
- Contoh bagus: Jika komentar bertanya soal animasi, Ramos menjelaskan teknik yang dipakai.
- Contoh buruk: "Makasih banyak! 🙏" (terlalu generik).` : `
BALASAN: Tidak perlu balasan — set replies ke array kosong [].`}

FORMAT OUTPUT — JSON array murni tanpa markdown codeblock:
[
  {
    "text": "komentar spesifik tentang proyek",
    "name": "Nama Komentator",
    "likes": 15,
    "replies": [${params.reply ? `
      {
        "text": "balasan spesifik dari Ramos",
        "name": "Ramos",
        "likes": 5
      }` : ''}
    ]
  }
]

Hanya kembalikan array JSON tersebut.`;

    let text = '';

    // --- Provider 1: Gemini Direct API (more stable, tried first) ---
    if (geminiApiKey) {
      const modelCandidates = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];
      type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };
      const requestBody: { contents: Array<{ parts: GeminiPart[] }>; generationConfig: { response_mime_type: string } } = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: 'application/json' },
      };

      if (base64Data) {
        requestBody.contents[0].parts.push({ inline_data: { mime_type: mimeType, data: base64Data } });
      }

      for (const model of modelCandidates) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        
        let response: Response | null = null;
        let attempts = 0;
        const maxAttempts = 2;

        while (attempts < maxAttempts) {
          attempts++;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);

          try {
            response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiApiKey },
              body: JSON.stringify(requestBody),
              signal: controller.signal,
            });
          } catch (err) {
            if (attempts >= maxAttempts) {
              console.warn(`[AI Comments] Gemini ${model} request error:`, err);
              break;
            }
            console.warn(`[AI Comments] Gemini ${model} request failed, retrying in 2s...`);
            await sleep(2000);
            continue;
          } finally {
            clearTimeout(timeoutId);
          }

          if (response.ok) {
            const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }> };
            const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            text = typeof candidateText === 'string' ? candidateText : '';
            if (text) {
              console.log(`[AI Comments] Comments generated via Gemini ${model}`);
              break;
            }
          } else {
            console.warn(`[AI Comments] Gemini ${model} returned status ${response.status}`);
            if (response.status === 429 && attempts < maxAttempts) {
              console.warn(`[AI Comments] Gemini ${model} rate limited (429), retrying in 2s...`);
              await sleep(2000);
              continue;
            }
          }
          break;
        }

        if (text) break;
      }
    }

    // --- Provider 2: OpenRouter Free Tier (fallback) ---
    if (!text && openRouterApiKey) {
      const modelCandidates = [
        'nvidia/nemotron-nano-12b-v2-vl:free',
        'google/gemma-3-4b-it:free',
        'openrouter/free',
      ];

      type OpenRouterContentPart =
        | { type: 'text'; text: string }
        | { type: 'image_url'; image_url: { url: string } };
      const messages: Array<{ role: 'user'; content: OpenRouterContentPart[] }> = [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }],
        },
      ];

      if (base64Data && !mimeType.startsWith('video/')) {
        messages[0].content.push({
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64Data}`,
          },
        });
      }

      for (const model of modelCandidates) {
        let response: Response | null = null;
        let attempts = 0;
        const maxAttempts = 2;

        while (attempts < maxAttempts) {
          attempts++;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 45000);

          try {
            response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${openRouterApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                'X-Title': 'Portfolio Shared Admin',
              },
              body: JSON.stringify({ model, messages, temperature: 0.5, max_tokens: 1200 }),
              signal: controller.signal,
            });
          } catch (err) {
            if (attempts >= maxAttempts) {
              console.warn(`[AI Comments] OpenRouter ${model} request error:`, err);
              break;
            }
            console.warn(`[AI Comments] OpenRouter ${model} request failed, retrying in 2s...`);
            await sleep(2000);
            continue;
          } finally {
            clearTimeout(timeoutId);
          }

          if (response.ok) {
            const data = (await response.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
            const content = data.choices?.[0]?.message?.content;
            text = typeof content === 'string' ? content : '';
            if (text) {
              console.log(`[AI Comments] Comments generated via OpenRouter ${model}`);
              break;
            }
          } else {
            const body = await response.text();
            console.warn(`[AI Comments] OpenRouter ${model} returned status ${response.status}: ${body.slice(0, 200)}`);
            if (response.status === 429 && attempts < maxAttempts) {
              console.warn(`[AI Comments] OpenRouter ${model} rate limited (429), retrying in 2s...`);
              await sleep(2000);
              continue;
            }
          }
          break;
        }

        if (text) break;
      }
    }

    if (!text) throw new Error('AI providers returned empty or failed to respond');

    const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedArray = JSON.parse(jsonText) as unknown;
    if (!Array.isArray(parsedArray)) throw new Error('AI output is not a JSON array');

    const NAMES = [
      'Bagas', 'Dinda', 'Rizky', 'Siti', 'Adit', 'Fajri', 'Tiara', 'Gilang', 'Putri', 'Zaki',
      'Budi', 'Ani', 'Joko', 'Rina', 'Setiawan', 'Maya', 'Hendra', 'Dewi', 'Agus', 'Mega',
      'Fajar', 'Fitri', 'Ahmad', 'Laras', 'Bayu', 'Wulan', 'Dedi', 'Indah', 'Rudi', 'Sari',
      'Andi', 'Nia', 'Toni', 'Putu', 'Made', 'Nyoman', 'Ketut', 'Gede', 'Wayan', 'Ilham',
      'Angga', 'Bella', 'Chandra', 'Dimas', 'Eka', 'Febri', 'Gita', 'Hana', 'Indra', 'Jihan',
      'Kurniawan', 'Lia', 'Maman', 'Novi', 'Okta', 'Pratama', 'Qori', 'Rangga', 'Shinta', 'Taufik',
      'Umar', 'Vina', 'Wahyu', 'Xena', 'Yanto', 'Zahra', 'Arief', 'Bambang', 'Catur', 'Dwi',
      'Edi', 'Farhan', 'Galih', 'Hari', 'Irfan', 'Jaka', 'Kevin', 'Lutfi', 'Mulyono', 'Nanda',
      'Oki', 'Panji', 'Rama', 'Sandy', 'Tegar', 'Ujang', 'Vicky', 'Wawan', 'Yuda', 'Zul',
      'Aldo', 'Bunga', 'Citra', 'Doni', 'Elsa', 'Faisal', 'Grace', 'Iwan', 'Joni',
      'Kartika', 'Luluk', 'Mahendra', 'Neneng', 'Olga', 'Putra', 'Rian', 'Siska', 'Tari', 'Uli',
      'Valen', 'Widi', 'Yogi', 'Zainal', 'Abdi', 'Bintang', 'Cipta', 'Danu', 'Endang', 'Feri',
      'Guntur', 'Husein', 'Imam', 'Julio', 'Kiki', 'Lukman', 'Mila', 'Nunu', 'Oky', 'Pipin',
      'Restu', 'Seno', 'Tio', 'Utoyo', 'Vero', 'Wira', 'Yunus', 'Zain', 'Samsul', 'Eka',
      'Fani', 'Hana', 'Lala', 'Taufan', 'Dewo', 'Arya', 'Sakti', 'Gusti', 'Agung', 'Cokorda'
    ];
    interface AiReplyDraft { text?: unknown; name?: unknown; likes?: unknown; }
    interface AiCommentDraft extends AiReplyDraft { replies?: unknown; }
    const toOptionalString = (value: unknown) => typeof value === 'string' && value.trim() ? value : undefined;

    const mappedComments: Comment[] = parsedArray.map((item, i: number) => {
      const c = item as AiCommentDraft;
      const name = toOptionalString(c.name) || NAMES[Math.floor(Math.random() * NAMES.length)];
      const replyDrafts = Array.isArray(c.replies) ? c.replies : [];
      const replies = replyDrafts
        .map((replyItem, ri: number) => {
          const r = replyItem as AiReplyDraft;
          const replyText = toOptionalString(r.text);
          if (!replyText) return null; // Skip replies with no actual text
          const replyName = toOptionalString(r.name) || 'Ramos';
          return {
          id: `r-${params.slug}-${i}-${ri}-ai`,
          text: replyText,
          name: replyName,
          time: 'Baru saja',
          createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          likes: typeof r.likes === 'number' ? r.likes : Math.floor(Math.random() * 10),
          avatar: replyName === 'Ramos' ? `https://ui-avatars.com/api/?name=Ramos&background=000&color=fff` : `https://ui-avatars.com/api/?name=${replyName}&background=random`,
        };
      })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      const commentText = toOptionalString(c.text);
      if (!commentText) return null; // Skip entries with no actual comment text

      return {
        id: `c-${params.slug}-${i}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        text: commentText,
        name: name,
        time: 'Beberapa menit yang lalu',
        createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        likes: typeof c.likes === 'number' ? c.likes : Math.floor(Math.random() * 50),
        replies: replies,
        avatar: `https://ui-avatars.com/api/?name=${name}&background=random`,
      };
    }).filter((c): c is NonNullable<typeof c> => c !== null);

    return mappedComments;
  } catch (err) {
    console.error('[AI Comments] AI Generation failed:', err);
    throw err instanceof Error ? err : new Error('Gagal memproses Real AI generation');
  }
}

export async function POST(req: NextRequest) {
  if (!(await validateAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      slug,
      likes,
      shares,
      commentCount,
      tone,
      reply,
      projectTitle,
      projectDescription,
      cover,
      imageBase64,
    } = await req.json();

    const commentSlug = typeof slug === 'string' && slug.trim() ? slug.trim() : 'temp-slug';

    // 1. Calculate Metrics (in-memory only, no DB writes)
    const generatedMetrics = generateViralMetrics();
    const metrics = {
      likes: typeof likes === 'number' ? likes : generatedMetrics.likes,
      shares: typeof shares === 'number' ? shares : generatedMetrics.shares,
    };

    // 2. Generate Comments (in-memory only, no DB writes)
    const finalCommentCount = typeof commentCount === 'number' ? commentCount : 5;
    const finalReply = typeof reply === 'boolean' ? reply : true;

    // Generate context-aware AI comments (or fall back to mock comments)
    const newComments = await generateAiCommentsWithFallback({
      slug: commentSlug,
      count: finalCommentCount,
      tone: tone || 'casual',
      reply: finalReply,
      projectTitle,
      projectDescription,
      cover,
      imageBase64,
      reqUrl: req.url,
    });

    return NextResponse.json({
      success: true,
      metrics,
      commentCount: newComments.length,
      comments: newComments,
    });
  } catch (error) {
    console.error('Magic Complete Error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        error: 'Failed to complete magic operation',
      },
      { status: 500 }
    );
  }
}
