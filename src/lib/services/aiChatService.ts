import { geminiModel } from "@/lib/gemini";
import aboutData from "@/data/about.json";
import hardSkillsData from "@/data/hardSkills.json";
import experienceData from "@/data/experience.json";
import { ChatMessage } from "@/lib/chatStore";

export interface AIResponse {
    text: string;
    error?: string;
}

export const aiChatService = {
    async generateResponse(messages: ChatMessage[]): Promise<AIResponse> {
        // Extract basic info about Ramos to provide context
        const bio = aboutData.professional.bio.content;
        const softSkills = aboutData.softSkills.texts.join(', ');
        const skills = hardSkillsData.skills.slice(0, 5).map(s => s.name).join(', ');
        const experiences = experienceData.workExperience.slice(0, 3).map(e => `${e.position} di ${e.company} (${e.year})`).join(', ');

        // Format history for context (last 5-10 messages)
        const chatHistory = messages.slice(-10).map(m => {
            const role = m.sender === 'visitor' ? 'Visitor' : 'Ramos';
            return `${role}: ${m.text}`;
        }).join('\n');

        const prompt = `
            Kamu adalah AI yang mewakili "Ramos", seorang Senior Visual/Graphic Designer dengan pengalaman 14 tahun.
            Tugasmu adalah membalas chat pengunjung website. 

            --- ATURAN GAYA BAHASA (WAJIB DIIKUTI 100%) ---
            1. **Super Natural & Santai:** Gunakan bahasa Indonesia percakapan sehari-hari layaknya nge-chat di WhatsApp. Boleh pakai "aku" atau "saya", gunakan imbuhan santai seperti "sih", "nih", "ya", "kok", "banget". 
            2. **Bukan Robot:** DILARANG KERAS menggunakan kalimat kaku AI seperti: "Tentu saja", "Ada yang bisa saya bantu hari ini?", "Sebagai representasi AI", atau "Mari kita bahas".
            3. **Singkat & Padat:** Orang nge-chat di WA itu balasannya pendek-pendek. Maksimal 1-3 kalimat saja. Jangan bikin paragraf panjang.
            4. **Nyambung & Asik:** Baca RIWAYAT OBROLAN. Kalau pengunjung bilang "Keren webnya", balas dengan santai: "Haha thank you banget! Btw ada project yang lagi dikerjain kah?" (Jangan terlalu kaku).
            5. **Jangan Mengulang Sapaan:** Kalau di RIWAYAT OBROLAN sudah pernah bilang "Halo", jangan bilang "Halo" lagi di chat selanjutnya. Langsung to the point ke percakapan.
            6. **Harga & Waktu = Rahasia:** JIKA pengunjung bertanya soal HARGA, BIAYA, BUDGET, atau DURASI/WAKTU PENGERJAAN, JANGAN PERNAH menyebut angka, estimasi, atau menebak-nebak! Langsung jawab dengan asik: "Wah kalau urusan budget/timeline gitu mending langsung ngobrol sama Ramos-nya aja deh. Bentar lagi dia pegang HP kok buat diskusiin sedetailnya! 😄"
            7. **Faktual Anti-Halu Pekerjaan:** JIKA ditanya soal PEKERJAAN MASA LALU atau "Kerja di mana?", jawab murni berdasarkan data "Pengalaman Kerja" di bawah. DILARANG NGARANG!

            --- PROFIL RAMOS ---
            Bio: ${bio}
            Soft Skills: ${softSkills}
            Keahlian: ${skills}
            Pengalaman Kerja: ${experiences}

            --- RIWAYAT OBROLAN ---
            ${chatHistory}

            Balas pesan terakhir Visitor dengan format string langsung tanpa embel-embel "Ramos:" atau tanda kutip tambahan.
        `;

        try {
            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            return { text: response.text().trim() };
        } catch (error: unknown) {
            console.error("[AIChatService] Gemini error:", error);
            
            // --- GROQ FALLBACK (ANTI-MATI) ---
            const groqKey = process.env.GROQ_API_KEY;
            if (groqKey) {
                try {
                    console.log("[AIChatService] Attempting fallback to Groq AI...");
                    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${groqKey}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            model: "llama-3.1-8b-instant", // Model super cepat dan gratis dari Groq
                            messages: [
                                { role: "system", content: "You are a highly capable AI assistant matching the persona requested in the prompt. Output ONLY the response text." },
                                { role: "user", content: prompt }
                            ],
                            temperature: 0.7,
                            max_tokens: 250
                        })
                    });

                    if (groqRes.ok) {
                        const groqData = await groqRes.json();
                        const groqText = groqData.choices[0].message.content;
                        return { text: groqText.trim() }; // ✅ Berhasil diselamatkan oleh Groq
                    } else {
                        const groqErrorData = await groqRes.json();
                        console.error("[AIChatService] Groq API returned error:", groqErrorData);
                    }
                } catch (fallbackError) {
                    console.error("[AIChatService] Groq fallback network error:", fallbackError);
                }
            }

            // Mengirim balik pesan fallback beserta flag error agar bot Telegram Admin bisa memberi Notifikasi!
            const errorMessage = error instanceof Error ? error.message : "Unknown API Error";
            return {
                text: "Maaf, sistem AI sedang sibuk. Mohon tunggu, pesan Anda akan segera dibalas langsung oleh Ramos.",
                error: errorMessage + (groqKey ? " (And Groq Fallback also failed)" : " (No Groq Key configured for Fallback)")
            };
        }
    }
};
