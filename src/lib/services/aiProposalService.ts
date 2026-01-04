import { geminiModel } from "@/lib/gemini";
import { projectService } from "./projectService";
import aboutData from "@/data/about.json";

export const aiProposalService = {
    async generateProposalForJob(jobText: string): Promise<string> {
        // 1. Fetch relevant context
        const { projects } = await projectService.getProjects('published');

        // Prepare a condensed version of projects for the prompt to save tokens/complexity
        const projectContext = projects.map(p => ({
            title: p.title,
            tags: p.tags,
            description: p.description,
            slug: p.slug
        })).slice(0, 15); // Top 15 projects

        const bio = aboutData.professional.bio.content;
        const motto = aboutData.professional.motto.quote;

        // 2. Build the prompt
        const prompt = `
            Anda adalah asisten elit untuk Ramos, seorang Desainer Visual senior berpengalaman 14 tahun.
            Tugas Anda: Membuat PROPOSAL LAMARAN (Cover Letter) yang sangat persuasif berdasarkan informasi lowongan kerja di bawah ini.

            --- ATURAN KRITIKAL ---
            1. Ramos ingin FOKUS sebagai "Graphic Designer" atau "Visual Designer". 
            2. JANGAN menonjolkan atau menawarkan skill "Video Editing". Ramos sengaja menghindari role yang mengharuskan desain sekaligus edit video (double-job).
            3. Jika lowongan meminta Video Editing, tetap fokuskan tawaran Ramos pada aspek Visual/Graphic Design sebagai spesialisasi utamanya.

            --- KONTEKS RAMOS ---
            Motto: ${motto}
            Bio Singkat: ${bio}
            Daftar Project Portofolio: ${JSON.stringify(projectContext)}

            --- INFORMASI LOWONGAN ---
            ${jobText}

            --- INSTRUKSI OUTPUT ---
            1. Gunakan bahasa Indonesia yang profesional namun berani, solutif, dan "to-the-point".
            2. Analisa apa masalah utama yang ingin diselesaikan klien di lowongan tersebut.
            3. Pilih MAKSIMAL 3 project dari daftar portofolio di atas yang PALING RELEVAN dengan kebutuhan client (utamakan project desain grafis).
            4. Jelaskan kenapa Ramos adalah pilihan terbaik (Hubungkan skill Desain Grafis Ramos dengan kebutuhan lowongan).
            5. Tambahkan Call to Action (CTA) yang kuat di akhir.
            6. Format output menggunakan Markdown agar enak dibaca di Telegram.
            7. Pastikan Anda menyertakan link portfolio per project dengan format: https://portofolio-ramos.vercel.app/works/[slug]

            Buatlah proposal yang bikin klien berhenti scroll dan langsung ingin hire Ramos sebagai Desainer Visual andalan mereka!
        `;

        try {
            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("[AIProposalService] Gemini error:", error);
            throw new Error("Gagal generate proposal. Pastikan API Key Gemini sudah benar.");
        }
    }
};
