import { geminiModel } from "@/lib/gemini";
import aboutData from "@/data/about.json";
import experienceData from "@/data/experience.json";
import hardSkillsData from "@/data/hardSkills.json";
import { jsPDF } from "jspdf";

export const atsService = {
    async tailorResume(jobText: string): Promise<{ pdfBuffer: Buffer; hrMessage: string; analysis: string }> {
        // 1. Prepare Base Data
        const baseBio = aboutData.professional.bio.content;
        const contacts = (aboutData as any).professional.contacts;

        const workHistory = experienceData.workExperience.map(exp => ({
            company: exp.company,
            position: exp.position,
            year: exp.year,
            desc: exp.description
        }));

        const hardSkills = hardSkillsData.skills.map(s => ({
            name: s.name,
            level: s.level,
            details: s.details
        }));

        const softSkills = aboutData.softSkills.texts;

        // 2. AI Tailoring Prompt
        const prompt = `
            Anda adalah pakar HR dan ATS (Applicant Tracking System) yang sangat teliti.
            Tugas Anda: Membedah lowongan kerja dan menyesuaikan Resume Ramos (Desainer Grafis/Visual dengan pengalaman 14+ tahun).

            --- ATURAN KRITIKAL ---
            1. Ramos ingin FOKUS sebagai "Graphic Designer" atau "Visual Designer". 
            2. JANGAN menonjolkan atau memfokuskan diri pada skill "Video Editing". Ramos sengaja ingin menghindari role double-job (Design + Video).
            3. Fokuskan pada keahlian Branding, Layout, Typography, Marketing Visuals, dan UI Design (Figma).

            --- DATA ASLI RAMOS ---
            Bio: ${baseBio}
            Kontak: ${JSON.stringify(contacts)}
            Pengalaman Kerja: ${JSON.stringify(workHistory)}
            Hard Skills: ${JSON.stringify(hardSkills)}
            Soft Skills: ${JSON.stringify(softSkills)}

            --- LOWONGAN KERJA ---
            ${jobText}

            --- INSTRUKSI ---
            1. ANALYSIS: Berikan analisa singkat kenapa Ramos cocok untuk loker ini (fokus pada aspek DESIGN) dan apa kata kunci utama yang dimasukkan.
            2. Professional Summary: Tonjolkan Ramos sebagai Desainer Visual senior yang strategis.
            3. Experience Tailoring: Sesuaikan poin-poin agar relevan dengan loker, fokus pada hasil Desain (Graphic/Visual).
            4. Skills Selection: Pilih skill yang mendukung role Desainer Grafis.

            --- FORMAT OUTPUT (JSON ONLY) ---
            {
                "analysis": "...",
                "summary": "...",
                "experience": [
                    { "company": "...", "position": "...", "year": "...", "bullets": ["...", "..."] }
                ],
                "skills": ["HardSkill1", "HardSkill2", "..."],
                "hrMessage": "..."
            }
        `;

        try {
            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean JSON string
            const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
            const data = JSON.parse(jsonStr);

            // 3. Generate PDF Buffer
            const pdfBuffer = await this.generatePdf(data);

            return {
                pdfBuffer,
                hrMessage: data.hrMessage,
                analysis: data.analysis
            };
        } catch (error) {
            console.error("[ATS Service] Error:", error);
            throw error;
        }
    },

    async generatePdf(data: any): Promise<Buffer> {
        const doc = new jsPDF();
        const margin = 20;
        const pageWidth = 210;
        const contentWidth = pageWidth - (margin * 2);
        let y = 20;

        const addWrappedText = (text: string, fontSize: number, style: 'bold' | 'normal' = 'normal', color = [0, 0, 0]) => {
            doc.setFont("helvetica", style);
            doc.setFontSize(fontSize);
            doc.setTextColor(color[0], color[1], color[2]);
            const lines = doc.splitTextToSize(text, contentWidth);
            if (y + (lines.length * (fontSize / 2)) > 280) { doc.addPage(); y = 20; }
            doc.text(lines, margin, y);
            y += (lines.length * (fontSize / 2)) + 2;
        };

        const contacts = (aboutData as any).professional.contacts;

        // --- HEADER ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.text("RAMOS", margin, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Graphic Designer & Visual Strategist", margin, y);
        y += 5;

        // Contact Info
        doc.setFontSize(9);

        let currentX = margin;

        // Email
        doc.setTextColor(0, 0, 255);
        const emailText = contacts.email;
        (doc as any).text(emailText, currentX, y, { url: `mailto:${contacts.email}` });
        currentX += doc.getTextWidth(emailText) + 2;

        // Separator
        doc.setTextColor(0, 0, 0);
        doc.text("|", currentX, y);
        currentX += doc.getTextWidth("|") + 2;

        // WhatsApp
        doc.setTextColor(0, 0, 255);
        const waText = contacts.whatsapp;
        const cleanWa = contacts.whatsapp.replace(/\D/g, '').replace(/^0/, '62');
        (doc as any).text(waText, currentX, y, { url: `https://wa.me/${cleanWa}` });
        currentX += doc.getTextWidth(waText) + 2;

        // Separator
        doc.setTextColor(0, 0, 0);
        doc.text("|", currentX, y);
        currentX += doc.getTextWidth("|") + 2;

        // LinkedIn
        doc.setTextColor(0, 0, 255);
        const liText = contacts.linkedin;
        const liUrl = contacts.linkedin.startsWith('http') ? contacts.linkedin : `https://${contacts.linkedin}`;
        (doc as any).text(liText, currentX, y, { url: liUrl });

        y += 5;
        (doc as any).text("Portfolio: https://portofolio-ramos.vercel.app", margin, y, { url: "https://portofolio-ramos.vercel.app" });
        doc.setTextColor(0, 0, 0);
        y += 12;

        // --- SECTION: SUMMARY ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(180, 0, 0);
        doc.text("PROFESSIONAL SUMMARY", margin, y);
        y += 6;
        doc.setLineWidth(0.5);
        doc.line(margin, y - 4, margin + 50, y - 4);
        addWrappedText(data.summary, 10, "normal");
        y += 5;

        // --- SECTION: SKILLS ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(180, 0, 0);
        doc.text("CORE COMPETENCIES", margin, y);
        y += 6;
        addWrappedText(data.skills.join(" | "), 10, "normal");
        y += 8;

        // --- SECTION: EXPERIENCE ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(180, 0, 0);
        doc.text("PROFESSIONAL EXPERIENCE", margin, y);
        y += 6;

        for (const exp of data.experience) {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text(`${exp.position}`, margin, y);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(exp.year, margin + contentWidth, y, { align: "right" });
            y += 5;
            doc.setFont("helvetica", "italic");
            doc.text(exp.company, margin, y);
            y += 5;
            doc.setFont("helvetica", "normal");
            for (const bullet of exp.bullets) {
                const bulletText = `• ${bullet}`;
                const lines = doc.splitTextToSize(bulletText, contentWidth - 5);
                if (y + (lines.length * 5) > 280) { doc.addPage(); y = 20; }
                doc.text(lines, margin + 5, y);
                y += (lines.length * 5);
            }
            y += 4;
        }

        // --- EDUCATION ---
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(180, 0, 0);
        doc.text("EDUCATION", margin, y);
        y += 6;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text("Desain Grafis | SMK & Professional Certifications", margin, y);

        const pdfArrayBuffer = doc.output('arraybuffer');
        return Buffer.from(pdfArrayBuffer);
    }
};
