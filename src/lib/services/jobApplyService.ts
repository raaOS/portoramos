import { jsPDF } from 'jspdf';
import { generateText } from '@/lib/gemini';
import aboutData from '@/data/about.json';
import experienceData from '@/data/experience.json';
import hardSkillsData from '@/data/hardSkills.json';

interface ApplyResult {
  proposal: string;
  hrMessage: string;
  analysis: string;
  pdfBuffer: Buffer;
  /** Filename yang sudah disesuaikan dengan job (mis. "Resume_Ramos_<Title>_<Company>.pdf"). */
  pdfFilename: string;
}

interface ParsedJob {
  title: string;
  company: string;
  salary?: string;
  location?: string;
  workType?: string;
  education?: string;
  experience?: string;
  skills: string[];
  requirements: string[];
  redFlags: string[];
}

/**
 * Bagian PDF yang diharapkan AI sesuaikan per-job. Semua field opsional —
 * kalau AI gagal atau quota habis, masing-masing fallback ke versi statis
 * dari `aboutData` / `experienceData` / `hardSkillsData`.
 */
interface TailoredResume {
  summary: string;
  skills: string[];
  experience: Array<{ position: string; year: string; company: string; bullets: string[] }>;
}

function compactJobText(jobText: string): string {
  return jobText.replace(/\s+/g, ' ').trim().slice(0, 8000);
}

function contactSummary(): { email?: string; whatsapp?: string; site: string } {
  const contacts = (aboutData as { professional: { contacts: Record<string, string> } })
    .professional.contacts;
  const configuredSite =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  return {
    email: process.env.JOB_EMAIL || contacts.email,
    whatsapp: contacts.whatsapp,
    site:
      configuredSite && !configuredSite.includes('localhost')
        ? configuredSite.replace(/\/$/, '')
        : 'https://ramos-portofolio.vercel.app',
  };
}

function parseListAfter(label: string, lines: string[], max = 10): string[] {
  const index = lines.findIndex((line) => line.toLowerCase().includes(label.toLowerCase()));
  if (index === -1) return [];

  const values: string[] = [];
  for (const line of lines.slice(index + 1)) {
    if (
      /^(benefit kerja|loker ini dikelola|deskripsi pekerjaan|tentang perusahaan|proses wawancara|informasi tambahan)$/i.test(
        line
      )
    )
      break;
    if (/^(coba lanjut melamar|skills)$/i.test(line)) continue;
    if (line.length > 2 && line.length < 80) values.push(line);
    if (values.length >= max) break;
  }
  return values;
}

function parseRequirements(lines: string[]): string[] {
  const start = lines.findIndex((line) => /deskripsi pekerjaan/i.test(line));
  const source = start >= 0 ? lines.slice(start + 1) : lines;

  return source
    .filter((line) =>
      /^[-*#]|minimal|memiliki|menguasai|memahami|mampu|terbiasa|pengalaman|pendidikan/i.test(line)
    )
    .map((line) => line.replace(/^[-*#\s]+/, '').trim())
    .filter((line) => line.length > 12)
    .slice(0, 10);
}

function parseJob(jobText: string): ParsedJob {
  const lines = jobText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^Source:|^Page title:/i.test(line));

  const title = lines[0] || 'Graphic Designer';
  const company = lines[1] || 'Perusahaan';
  const salary = lines.find((line) => /rp[\d.]+/i.test(line));
  const workType = lines.find((line) =>
    /penuh waktu|paruh waktu|kontrak|freelance|magang|kerja di lokasi|hybrid|remote/i.test(line)
  );
  const education = lines.find((line) => /sma|smk|d3|s1|sarjana/i.test(line));
  const experience = lines.find((line) => /pengalaman/i.test(line));
  const location = lines.find((line) =>
    /jakarta|tangerang|bekasi|depok|bogor|bandung|surabaya|remote|hybrid/i.test(line)
  );
  const skills = parseListAfter('Skills', lines, 12);
  const requirements = parseRequirements(lines);
  const lower = jobText.toLowerCase();
  const redFlags = [
    lower.includes('laki-laki saja') ? 'gender-specific requirement' : '',
    lower.includes('24-30 tahun') ? 'age range 24-30' : '',
    /video|videografi|editing/.test(lower) ? 'video/editing requested' : '',
    /kerja di lokasi|wfo/.test(lower) ? 'on-site work' : '',
  ].filter(Boolean);

  return {
    title,
    company,
    salary,
    location,
    workType,
    education,
    experience,
    skills,
    requirements,
    redFlags,
  };
}

function matchingSkills(job: ParsedJob): string[] {
  const haystack = `${job.skills.join(' ')} ${job.requirements.join(' ')}`.toLowerCase();
  const known = hardSkillsData.skills.map((skill) => skill.name);
  const direct = known.filter((skill) => haystack.includes(skill.toLowerCase()));
  const inferred = [
    haystack.includes('photoshop') ? 'Adobe Photoshop' : '',
    haystack.includes('illustrator') ? 'Adobe Illustrator' : '',
    haystack.includes('indesign') ? 'Adobe InDesign' : '',
    haystack.includes('canva') ? 'Canva' : '',
    haystack.includes('brand') ? 'Brand Design' : '',
    haystack.includes('packaging') ? 'Packaging Design' : '',
    haystack.includes('logo') ? 'Logo Design' : '',
    haystack.includes('typography') ? 'Typography' : '',
    haystack.includes('social media') ? 'Social Media Design' : '',
  ].filter(Boolean);

  return [...new Set([...job.skills, ...direct, ...inferred])].slice(0, 12);
}

function fallbackAnalysis(jobText: string, job: ParsedJob): string {
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

function fallbackHrMessage(job: ParsedJob): string {
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

function fallbackProposal(job: ParsedJob): string {
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

async function tryAiApply(
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

/**
 * Build a fully job-tailored resume content tree:
 *   - Summary di-rewrite jadi 2-3 kalimat yang langsung menyebut role + bidang.
 *   - Skills di-rerank: skill yang muncul di job requirements / sering disebut
 *     keyword-nya didahulukan, sisanya menyusul.
 *   - Experience di-pick + bullets di-rerank sehingga yang paling relevan ke
 *     job teratas.
 *
 * Strategi: kirim seluruh resume mentah + job text ke Gemini, minta JSON.
 * Kalau AI gagal / disabled, fallback ke versi statis (sama seperti dulu).
 */
async function tailorResumeContent(jobText: string, job: ParsedJob): Promise<TailoredResume> {
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

  // Kirim semua experience (tidak cuma 4) supaya AI bisa pilih yang paling
  // relevan ke job. Bullets juga full, bukan top-3.
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

    // Whitelist skills supaya AI tidak invent yang tidak ada di data master.
    const allowedSkills = new Set(allSkills.map((s) => s.toLowerCase()));
    const safeSkills = parsed.skills
      .filter((s): s is string => typeof s === 'string')
      .filter((s) => allowedSkills.has(s.toLowerCase()))
      .slice(0, 14);

    // Whitelist experience entries by company+position pair supaya AI tidak
    // bikin perusahaan/role baru.
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

/**
 * Build a job-aware filename like
 *   Resume_Ramos_GraphicDesigner_PT_Mandiri_Utama_Finance.pdf
 * Falls back to the original name if title/company missing or sanitization
 * leaves nothing usable. Total length capped to 80 chars to stay friendly
 * across mail/messaging clients.
 */
function buildPdfFilename(job: ParsedJob): string {
  const sanitize = (raw: string) =>
    raw
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .replace(/\s+/g, '_')
      .slice(0, 32);

  const titlePart = sanitize(job.title || '');
  const companyPart = sanitize(job.company || '');

  const segments = ['Resume_Ramos_ATS'];
  if (titlePart) segments.push(titlePart);
  if (companyPart) segments.push(companyPart);

  const name = segments.join('_').slice(0, 80);
  return `${name || 'Resume_Ramos_ATS_Apply'}.pdf`;
}

async function generateBasicPdf(data: {
  summary: string;
  skills: string[];
  experience: Array<{ position: string; year: string; company: string; bullets: string[] }>;
}): Promise<Buffer> {
  const doc = new jsPDF();
  const margin = 20;
  const contentWidth = 170;
  let y = 20;
  const contacts = contactSummary();

  const addText = (text: string, fontSize = 10, style: 'normal' | 'bold' = 'normal') => {
    doc.setFont('helvetica', style);
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, contentWidth);
    if (y + lines.length * 6 > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, margin, y);
    y += lines.length * 6 + 2;
  };

  addText('RAMOS', 22, 'bold');
  addText('Graphic Designer & Visual Strategist', 10);
  addText([contacts.email, contacts.whatsapp, contacts.site].filter(Boolean).join(' | '), 9);
  y += 6;

  addText('PROFESSIONAL SUMMARY', 12, 'bold');
  addText(data.summary);
  y += 4;

  addText('CORE SKILLS', 12, 'bold');
  addText(data.skills.join(' | '));
  y += 4;

  addText('EXPERIENCE', 12, 'bold');
  for (const exp of data.experience) {
    addText(`${exp.position} - ${exp.company} (${exp.year})`, 10, 'bold');
    for (const bullet of exp.bullets.slice(0, 3)) {
      addText(`- ${bullet}`, 9);
    }
    y += 2;
  }

  return Buffer.from(doc.output('arraybuffer'));
}

export const jobApplyService = {
  async prepare(jobText: string): Promise<ApplyResult> {
    const job = parseJob(jobText);
    // Run text-output AI and resume-tailoring AI in parallel; both
    // independently fall back to deterministic templates when the flag
    // is off or the API is down, so neither blocks the other.
    const [ai, tailored] = await Promise.all([
      tryAiApply(jobText),
      tailorResumeContent(jobText, job),
    ]);
    const analysis = ai?.analysis || fallbackAnalysis(jobText, job);
    const hrMessage = ai?.hrMessage || fallbackHrMessage(job);
    const proposal = ai?.proposal || fallbackProposal(job);

    const pdfBuffer = await generateBasicPdf({
      summary: tailored.summary,
      skills: tailored.skills,
      experience: tailored.experience,
    });

    return {
      analysis,
      hrMessage,
      proposal,
      pdfBuffer,
      pdfFilename: buildPdfFilename(job),
    };
  },
};
