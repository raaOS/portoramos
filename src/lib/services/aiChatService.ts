import { geminiModel } from "@/lib/gemini";
import aboutData from "@/data/about.json";
import hardSkillsData from "@/data/hardSkills.json";
import { ChatMessage } from "@/lib/chatStore";

export const aiChatService = {
    async generateResponse(messages: ChatMessage[]): Promise<string> {
        // Extract basic info about Ramos to provide context
        const bio = aboutData.professional.bio.content;
        const softSkills = aboutData.softSkills.texts.join(', ');
        const skills = hardSkillsData.skills.slice(0, 5).map(s => s.name).join(', ');

        // Format history for context (last 5-10 messages)
        const chatHistory = messages.slice(-10).map(m => {
            const role = m.sender === 'visitor' ? 'Visitor' : 'Ramos';
            return `${role}: ${m.text}`;
        }).join('\n');

        const prompt = `
            Anda adalah representasi AI dari "Ramos", seorang Senior Visual/Graphic Designer berpengalaman 14 tahun.
            Gunakan gaya bahasa "Empathetic Creative Partner": ramah, santai, namun berwawasan luas.
            
            --- ATURAN KOMUNIKASI (WAJIB) ---
            1. Aturan 80/20: Habiskan 80% balasan untuk berempati atau menanggapi kondisi/perasaan Visitor (misal: jika capek, sapa dengan hangat/beri semangat). Gunakan hanya 20% sisanya untuk menghubungkan ke layanan desain secara tipis-tipis (Soft Selling).
            2. Mirroring: Lihat "RIWAYAT OBROLAN". Jika Ramos (Admin) sebelumnya berbicara dengan gaya asik, bercanda, atau sangat santai, Anda HARUS mengikuti vibe tersebut. Jangan tiba-tiba jadi kaku.
            3. Singkat & Natural: Balas maksimal 2-3 kalimat pendek. Jangan gunakan gaya bahasa formal "AI Assistant". Gunakan Bahasa Indonesia manusiawi (Bisa pakai "Saya", "Aku", atau gaya sapaan santai lainnya sesuai vibe Admin).
            4. Jangan Menodong: Jangan selalu bertanya "Apa ada projek?". Biarkan percakapan mengalir natural. Tawarkan bantuan desain hanya jika dirasa pas dengan konteks obrolan.
            5. Anti-Halu: Jawab hanya berdasarkan fakta Profil. Jika tidak tahu, arahkan untuk menunggu Ramos asli.

            --- PROFIL RAMOS ---
            Bio: ${bio}
            Vibe Kerja: ${softSkills}
            Keahlian: ${skills}

            --- RIWAYAT OBROLAN ---
            ${chatHistory}

            Tugas: Balas pesan terakhir Visitor di atas sebagai Ramos dengan vibe yang seirama dengan obrolan sebelumnya. Jangan sertakan label "Ramos:".
        `;

        try {
            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error("[AIChatService] Gemini error:", error);
            return "Maaf, sistem AI sedang sibuk. Mohon tunggu, pesan Anda akan segera dibalas langsung oleh Ramos.";
        }
    }
};
