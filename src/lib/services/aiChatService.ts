/**
 * AI Chat Service — Generate balasan otomatis dari Gemini AI untuk chat visitor.
 *
 * Menggunakan persona Ramos (bio, skills, pengalaman) sebagai system prompt.
 * Mendukung fallback ke Groq API jika Gemini gagal atau timeout (30s).
 * Filter vulgar/SARA diterapkan sebelum response dikembalikan.
 *
 * @module aiChatService
 */
import { geminiModel } from '@/lib/gemini';
import aboutData from '@/data/about.json';
import hardSkillsData from '@/data/hardSkills.json';
import experienceData from '@/data/experience.json';
import { ChatMessage } from '@/lib/chatStore';

function containsVulgarOrSARA(text: string): boolean {
  const bannedPatterns = [
    /\bkontol\b|\bmemek\b|\bangsat\b|\bbangsat\b|\bngentot\b|\bjancuk\b|\btai\b|\bsetan\b|\b-kimak\b|\b-peler\b|\b-tolol\b|\b-goblok\b|\b-bajingan\b|\b-sinting\b|\b-bego\b/i,
    /\b-fuck\b|\b-shit\b|\b-bitch\b|\b-asshole\b|\b-dick\b|\b-pussy\b|\b-cunt\b|\b-nigger\b|\b-fag\b|\b-chink\b/i,
    /\brasis\b|\bteroris\b|\bnazi\b|\b-hitler\b/i,
  ];
  return bannedPatterns.some((p) => p.test(text));
}

export interface AIResponse {
  text: string;
  error?: string;
}

export const aiChatService = {
  async generateResponse(messages: ChatMessage[]): Promise<AIResponse> {
    // Extract basic info about Ramos to provide context
    const bio = aboutData.professional.bio.content;
    const softSkills = aboutData.softSkills.texts.join(', ');
    const skills = hardSkillsData.skills
      .slice(0, 5)
      .map((s) => s.name)
      .join(', ');
    const experiences = experienceData.workExperience
      .slice(0, 3)
      .map((e) => `${e.position} di ${e.company} (${e.year})`)
      .join(', ');

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const cvLink = `${siteUrl}/cv`;

    // Format history for context (last 5-10 messages)
    const chatHistory = messages
      .slice(-10)
      .map((m) => {
        const role = m.sender === 'visitor' ? 'Visitor' : 'Ramos';
        return `${role}: ${m.text}`;
      })
      .join('\n');    const prompt = `
[PANDUAN UTAMA SYSTEM & ATURAN PERSONA]
Anda adalah AI representatif personal untuk "Ramos", seorang Visual & Graphic Designer muda yang cerdas, santai, dan melek tren.

[ATURAN MUTLAK GAYA BAHASA & ANTI-CS ROBOT (WAJIB DIIKUTI 100%)]
1. DILARANG KERAS MENGGUNAKAN FRASA CS ROBOT:
   DILARANG KERAS menulis frasa formal CS/Bot seperti:
   - "Saya senang kamu tertarik..." / "Halo lagi, aku senang..."
   - "Setelah membaca tentang..." / "Apakah kamu memiliki favorit di antara albumnya..."
   Semua frasa formal di atas DILARANG KERAS karena membuat Anda terdengar seperti bot otomatis!
2. DILARANG MENGARANG FAKTA / DEFINISI PALSU (ANTI-HALUSINASI):
   DILARANG KERAS mengarang/menciptakan definisi fiktif untuk nama/istilah (seperti mengarang nama orang sebagai platform). Jika pengunjung menyebut nama artis/public figure (misal: Sarwendah), jawab berdasarkan fakta nyata figur tersebut secara santai & akurat.
3. CONTEXT CONTINUITY & NYAMBUNG 100%:
   - Wajib membaca alur [Riwayat Obrolan] secara utuh dari awal hingga akhir.
   - Jika Anda sebelumnya memberikan opsi dan pengunjung memilih opsi tersebut, LANGSUNG bahas isu/fakta nyata dari topik pilihan pengunjung tanpa berpura-pura bingung atau berputar-putar.
   - Jawab dalam 1-2 kalimat santai khas percakapan WhatsApp antar teman (menggunakan "aku/kamu", imbuhan "sih", "nih").

4. TOPIC TRANSITION DIRECTIVE (DETEKSI PERALIHAN TOPIK BARU):
   - Jika pengunjung mengirimkan pesan dengan entitas/kata kunci baru (misalnya dari "Sarwendah" berpindah ke "Claude / AI", "Sepakbola", "Politik", "Teknologi", dll.): Anda WAJIB LANGSUNG BERALIH 100% membahas entitas/kata kunci baru tersebut!
   - DILARANG KERAS membawa-bawa nama subjek atau entitas dari obrolan lampau yang sudah ditinggalkan pengunjung (seperti terus-terusan membawa nama Sarwendah ketika pengunjung sudah bertanya tentang Claude)!

[PENGELOLAAN VISITOR & REKRUTMEN]
- Recruiter Mode: Jika pengunjung membahas posisi/hiring/CV → presentasikan profil Ramos & berikan link CV resmi (${cvLink}).
- Client Mode: Jika pengunjung membahas jasa/branding/desain → bahas portfolio & konsultasikan proyek visualnya.
- Privasi & Keamanan: Tarif freelance & nego gaji selalu diarahkan ke DM Telegram Ramos. Bebas dari kata kasar/SARA.

[PROFIL RAMOS]
Bio: ${bio}
Soft Skills: ${softSkills}
Keahlian Utama: ${skills}
Pengalaman Kerja: ${experiences}

[RIWAYAT OBROLAN]
${chatHistory}

Tugas Anda: Evaluasi [Riwayat Obrolan] di atas, jawab sebagai Ramos secara santai, akurat, tanpa frasa CS formal, dan nyambung 100%. Keluarkan teks balasan tanpa kutipan atau label peran.
`;

    try {
      const AI_TIMEOUT_MS = 30_000;
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Gemini timeout after ${AI_TIMEOUT_MS}ms`)),
          AI_TIMEOUT_MS
        )
      );
      const result = await Promise.race([geminiModel.generateContent(prompt), timeoutPromise]);
      const response = await result.response;
      let aiText = response.text().trim();
      if (containsVulgarOrSARA(aiText)) {
        console.warn('[AIChatService] Vulgar/SARA detected in Gemini output. Returning fallback.');
        aiText = 'Maaf, aku cuma bisa bantu soal desain dan portfolio Ramos ya. Ada yang lain? 😊';
      }
      return { text: aiText };
    } catch (error: unknown) {
      console.error('[AIChatService] Gemini error:', error);

      // --- GROQ FALLBACK (ANTI-MATI) ---
      const groqKey = process.env.GROQ_API_KEY;
      if (groqKey) {
        try {
          console.log('[AIChatService] Attempting fallback to Groq AI...');
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${groqKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama-3.1-8b-instant', // Model super cepat dan gratis dari Groq
              messages: [
                {
                  role: 'system',
                  content:
                    'You are a highly capable AI assistant matching the persona requested in the prompt. Output ONLY the response text.',
                },
                { role: 'user', content: prompt },
              ],
              temperature: 0.7,
              max_tokens: 250,
            }),
          });

          if (groqRes.ok) {
            const groqData = await groqRes.json();
            const groqText = groqData.choices[0].message.content;
            let fallbackText = groqText.trim();
            if (containsVulgarOrSARA(fallbackText)) {
              console.warn(
                '[AIChatService] Vulgar/SARA detected in Groq output. Returning fallback.'
              );
              fallbackText =
                'Maaf, aku cuma bisa bantu soal desain dan portfolio Ramos ya. Ada yang lain? 😊';
            }
            return { text: fallbackText }; // ✅ Berhasil diselamatkan oleh Groq
          } else {
            const groqErrorData = await groqRes.json();
            console.error('[AIChatService] Groq API returned error:', groqErrorData);
          }
        } catch (fallbackError) {
          console.error('[AIChatService] Groq fallback network error:', fallbackError);
        }
      }

      // Mengirim balik pesan fallback beserta flag error agar bot Telegram Admin bisa memberi Notifikasi!
      const errorMessage = error instanceof Error ? error.message : 'Unknown API Error';
      return {
        text: 'Maaf, sistem AI sedang sibuk. Mohon tunggu, pesan Anda akan segera dibalas langsung oleh Ramos.',
        error:
          errorMessage +
          (groqKey ? ' (And Groq Fallback also failed)' : ' (No Groq Key configured for Fallback)'),
      };
    }
  },
};
