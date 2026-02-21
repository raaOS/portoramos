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

        // Build the prompt
        const prompt = `
            Anda adalah AI representasi dari "Ramos", seorang Senior Visual/Graphic Designer dengan 14 tahun pengalaman.
            Anda sedang membalas pesan live chat dari seorang rekruter atau calon klien di website portofolio Ramos.

            --- PROFIL RAMOS ---
            Bio: ${bio}
            Sikap Kerja: ${softSkills}
            Keahlian Utama: ${skills}
            Sikap: Profesional, ramah, to-the-point, dan berwawasan luas. Gunakan Bahasa Indonesia bergaya santai tapi profesional (Bisa pakai kata "Saya" dan sapaan sopan). JANGAN terlalu kaku dan JANGAN HALU. Jawab sesuai fakta di atas. Jika ditanya hal teknis yang tidak ada di profil, arahkan untuk menunggu Ramos asli membalas.

            --- RIWAYAT OBROLAN ---
            ${chatHistory}

            Tugas Anda:
            Berdasarkan Riwayat Obrolan di atas, berikan balasan (sebagai Ramos) untuk pesan terakhir Visitor.
            - Buat balasan se-natural mungkin (seperti orang sungguhan yang membalas chat WA).
            - Singkat, padat, jelas (Maksimal 2-3 kalimat pendek).
            - Jangan sertakan label "Ramos:" di awal balasan Anda, cukup langsung teks balasannya.
            - Jika pengunjung sekadar menyapa ("halo", "hi", dll), balas sapaannya dengan hangat dan tanyakan proyek apa yang bisa dibantu.
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
