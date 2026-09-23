import aboutData from '@/data/about.json';
import hardSkillsData from '@/data/hardSkills.json';
import type { ParsedJob } from './types';

export function compactJobText(jobText: string): string {
  return jobText.replace(/\s+/g, ' ').trim().slice(0, 8000);
}

export function contactSummary(): { email?: string; whatsapp?: string; site: string } {
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

export function parseListAfter(label: string, lines: string[], max = 10): string[] {
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

export function parseRequirements(lines: string[]): string[] {
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

export function parseJob(jobText: string): ParsedJob {
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

export function matchingSkills(job: ParsedJob): string[] {
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

export function buildPdfFilename(job: ParsedJob): string {
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
