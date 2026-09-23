import { generateText } from '@/lib/ai';
import aboutData from '@/data/about.json';
import experienceData from '@/data/experience.json';
import hardSkillsData from '@/data/hardSkills.json';
import type { ParsedJob, ApplyResult, TailoredResume } from './types';
import {
  compactJobText,
  contactSummary,
  matchingSkills,
} from './jobApplyParser';

export function fallbackAnalysis(jobText: string, job: ParsedJob): string {
  const matched = matchingSkills(job);

  return [
    `Analisis lokal untuk ${job.title} - ${job.company}:`,
    job.salary ? `- Salary: ${job.salary}.` : '',
    job.workType ? `- Sistem kerja: ${job.workType}.` : '',
    matched.length
      ? `- Skill terdeteksi: ${matched.join(', ')}.`
      : '- Skill spesifik belum banyak terdeteksi dari teks.',
    job.requirements.length
      ? `- Requirement utama: ${job.requirements.slice(0, 4).join('; ')}.`
      : '',
    job.redFlags.length
      ? `- Red flag/check manual: ${job.redFlags.join(', ')}.`
      : '- Red flag besar belum terdeteksi.',
    '- Kecocokan: relevan untuk Graphic/Visual Designer karena memuat visual design, branding, dan asset kreatif.',
  ].join('\n');
}

export function fallbackHrMessage(job: ParsedJob): string {
  const contacts = contactSummary();

  return [
    `Halo, saya Ramos. Saya tertarik dengan posisi ${job.title} di ${job.company}.`,
    '',
    `Saya melihat kebutuhan role ini dekat dengan pengalaman saya di graphic design, visual branding, layout, dan marketing asset${job.skills.length ? `, terutama ${job.skills.slice(0, 5).join(', ')}` : ''}.`,
    'Saya terbiasa menerjemahkan brief menjadi visual yang rapi, komunikatif, dan konsisten dengan identitas brand.',
    '',
    `Portfolio: ${contacts.site}`,
    contacts.email ? `Email: ${contacts.email}` : '',
    contacts.whatsapp ? `WhatsApp: ${contacts.whatsapp}` : '',
    '',
    'Saya siap berdiskusi lebih lanjut jika profil saya sesuai dengan kebutuhan tim.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function fallbackProposal(job: ParsedJob): string {
  return [
    'Cover Letter:',
    '',
    `Saya tertarik melamar posisi ${job.title} di ${job.company}. Dari detail lowongan, role ini membutuhkan desainer yang mampu menjaga kualitas visual brand, membuat aset kreatif, dan mengeksekusi kebutuhan desain untuk kanal promosi maupun komunikasi brand.`,
    '',
    `Kekuatan saya ada pada graphic design, brand visual, layout, typography, dan marketing visuals${job.skills.length ? `. Skill yang relevan dengan kebutuhan lowongan ini: ${job.skills.slice(0, 8).join(', ')}` : ''}. Saya terbiasa menerjemahkan brief menjadi aset visual yang siap dipakai, rapi secara produksi, dan tetap kuat secara komunikasi.`,
    '',
    job.requirements.length
      ? `Saya juga melihat beberapa kebutuhan utama seperti ${job.requirements.slice(0, 3).join('; ')}. Area tersebut selaras dengan pengalaman saya dalam membuat visual yang konsisten, terstruktur, dan berorientasi kebutuhan bisnis.`
      : 'Untuk role ini, saya akan fokus membantu tim menjaga kualitas visual brand, membuat aset campaign/social media/promosi, dan memastikan output desain konsisten dengan karakter bisnis.',
    '',
    'Saya terbuka untuk proses interview atau diskusi singkat agar bisa menjelaskan kecocokan pengalaman saya dengan kebutuhan posisi ini.',
  ].join('\n');
}

export async function tryAiApply(
  jobText: string
): Promise<Omit<ApplyResult, 'pdfBuffer' | 'pdfFilename'> | null> {
  if (process.env.JOB_BOT_USE_AI_APPLY !== 'true') {
    return null;
  }

  const bio = aboutData.professional.bio.content;
  const contacts = contactSummary();
  const workHistory = experienceData.workExperience.slice(0, 5).map((exp) => ({
    company: exp.company,
    position: exp.position,
    year: exp.year,
    description: exp.description,
  }));
  const skills = hardSkillsData.skills.map((skill) => skill.name).slice(0, 25);

  const prompt = `
        Anda adalah job application assistant untuk Ramos, Graphic/Visual Designer senior.
        Fokus Ramos: Graphic Design, Visual Design, Branding, Layout, Typography, Marketing Visuals, UI/Figma.
        Jangan tonjolkan video editing sebagai skill utama.

        Profil:
        Bio: ${bio}
        Kontak: ${JSON.stringify(contacts)}
        Experience: ${JSON.stringify(workHistory)}
        Skills: ${JSON.stringify(skills)}

        Lowongan:
        ${compactJobText(jobText)}

        Output JSON only:
        {
          "analysis": "analisis singkat kecocokan + red flags",
          "hrMessage": "pesan pendek untuk HR/recruiter",
          "proposal": "cover letter/proposal profesional Bahasa Indonesia"
        }
    `;

  try {
    const text = await generateText(prompt);
    const json = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const parsed = JSON.parse(json) as { analysis?: string; hrMessage?: string; proposal?: string };

    if (!parsed.analysis || !parsed.hrMessage || !parsed.proposal) return null;
    return {
      analysis: parsed.analysis,
      hrMessage: parsed.hrMessage,
      proposal: parsed.proposal,
    };
  } catch (error) {
    console.warn('[JobApplyService] AI apply generation unavailable, using fallback:', error);
    return null;
  }
}

export async function tailorResumeContent(jobText: string, job: ParsedJob): Promise<TailoredResume> {
  const baseBio = aboutData.professional.bio.content;
  const baseSkills = [
    ...new Set([...matchingSkills(job), ...hardSkillsData.skills.map((skill) => skill.name)]),
  ].slice(0, 18);
  const baseExperience = experienceData.workExperience.slice(0, 4).map((exp) => ({
    company: exp.company,
    position: exp.position,
    year: exp.year,
    bullets: exp.description,
  }));
  const fallback: TailoredResume = {
    summary: baseBio,
    skills: baseSkills,
    experience: baseExperience,
  };

  if (process.env.JOB_BOT_USE_AI_APPLY !== 'true') {
    return fallback;
  }

  const allExperience = experienceData.workExperience.map((exp) => ({
    company: exp.company,
    position: exp.position,
    year: exp.year,
    bullets: exp.description,
  }));
  const allSkills = hardSkillsData.skills.map((skill) => skill.name);

  const prompt = `
        Anda adalah resume tailoring assistant untuk Ramos, Graphic/Visual Designer.
        Fokus Ramos: Graphic Design, Visual Design, Branding, Layout, Typography, Marketing Visuals, UI/Figma.
        Jangan tonjolkan video editing sebagai skill utama kecuali job memang minta.

        TUGAS: Sesuaikan isi resume di bawah ini supaya match dengan job target.

        Aturan ketat:
        - JANGAN mengarang skill atau pengalaman baru. Hanya boleh memilih, mengurutkan ulang, dan rewrite kalimat dari data yang sudah ada.
        - "summary": 2-3 kalimat profesional Bahasa Indonesia yang langsung menyambungkan profil Ramos ke kebutuhan job target. Sebut role / bidang yang diminta.
        - "skills": pilih dan urutkan SKILLS dari daftar tersedia. Yang paling relevan ke job di paling atas. Maksimum 14 skill.
        - "experience": pilih maksimum 4 entri experience yang paling relevan, urutkan dari paling relevan. Untuk tiap entri, pilih maksimum 3 bullets yang paling relevan. Boleh rewrite bullet supaya kalimatnya rapi tapi makna asli harus dipertahankan, JANGAN mengarang angka/metric/skill baru.

        DATA RESUME:
        Bio asli: ${aboutData.professional.bio.content}
        Skills tersedia: ${JSON.stringify(allSkills)}
        Experience tersedia: ${JSON.stringify(allExperience)}

        JOB TARGET (parsed):
        Title: ${job.title}
        Company: ${job.company}
        Location: ${job.location ?? '(unspecified)'}
        Requirements: ${JSON.stringify(job.requirements)}
        Skills disebut di lowongan: ${JSON.stringify(job.skills)}

        JOB TARGET (raw, max 6000 char):
        ${compactJobText(jobText).slice(0, 6000)}

        Output JSON only, schema:
        {
          "summary": "2-3 kalimat",
          "skills": ["skill1", "skill2", ...],
          "experience": [
            { "company": "...", "position": "...", "year": "...", "bullets": ["...", "..."] }
          ]
        }
    `;

  try {
    const text = await generateText(prompt);
    const json = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const parsed = JSON.parse(json) as Partial<TailoredResume>;

    if (!parsed.summary || !Array.isArray(parsed.skills) || !Array.isArray(parsed.experience)) {
      return fallback;
    }

    const allowedSkills = new Set(allSkills.map((s) => s.toLowerCase()));
    const safeSkills = parsed.skills
      .filter((s): s is string => typeof s === 'string')
      .filter((s) => allowedSkills.has(s.toLowerCase()))
      .slice(0, 14);

    const expIndex = new Map(
      allExperience.map((e) => [`${e.company.toLowerCase()}::${e.position.toLowerCase()}`, e])
    );
    const safeExperience = parsed.experience
      .filter(
        (e): e is NonNullable<typeof parsed.experience>[number] =>
          !!e && typeof e.company === 'string' && typeof e.position === 'string'
      )
      .map((e) => {
        const original = expIndex.get(`${e.company.toLowerCase()}::${e.position.toLowerCase()}`);
        if (!original) return null;
        const bullets = Array.isArray(e.bullets)
          ? e.bullets.filter((b): b is string => typeof b === 'string').slice(0, 3)
          : original.bullets.slice(0, 3);
        return {
          company: original.company,
          position: original.position,
          year: original.year,
          bullets: bullets.length > 0 ? bullets : original.bullets.slice(0, 3),
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .slice(0, 4);

    return {
      summary: parsed.summary.trim() || fallback.summary,
      skills: safeSkills.length > 0 ? safeSkills : fallback.skills,
      experience: safeExperience.length > 0 ? safeExperience : fallback.experience,
    };
  } catch (error) {
    console.warn('[JobApplyService] AI tailoring unavailable, using fallback:', error);
    return fallback;
  }
}
