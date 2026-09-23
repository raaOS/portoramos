export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export const JOBSTREET_DESIGN_URL = 'https://id.jobstreet.com/id/graphic-designer-jobs/in-Jakarta';

export function isBlockedPage(text: string, title: string): boolean {
  const haystack = `${title}\n${text}`.toLowerCase();
  return /access denied|cloudflare|captcha|verify you are human|just a moment|rate.limit/i.test(
    haystack
  );
}

export function normalizeJobUrl(href: string): string {
  const decoded = href.replace(/&amp;/g, '&');
  const url = decoded.startsWith('http')
    ? new URL(decoded)
    : new URL(decoded, 'https://id.jobstreet.com');
  url.search = '';
  url.hash = '';
  return url.toString();
}

export function hasTerm(haystack: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`).test(haystack);
}

export function scoreJob(title: string, text: string): { score: number; redFlags: string[] } {
  const haystack = `${title} ${text}`.toLowerCase();
  let score = 50;

  const photoshopTerms = [
    'photoshop',
    'adobe photoshop',
    'photo editing',
    'photo manipulation',
    'retouching',
    'retouch',
    'image editing',
    'digital imaging',
    'digital image',
  ];
  const roleTerms = [
    'graphic designer',
    'graphic design',
    'visual designer',
    'visual design',
    'social media designer',
    'sosmed designer',
    'desainer grafis',
    'desain grafis',
    'creative designer',
  ];
  const domainTerms = [
    'social media',
    'sosmed',
    'banner',
    'flyer',
    'poster',
    'brosur',
    'packaging',
    'layout',
    'typography',
    'logo',
    'brand',
    'branding',
    'feed',
    'carousel',
  ];
  const supportingTools = ['canva', 'affinity designer', 'affinity'];
  const minorTools = ['capcut'];
  const softNegatives = ['illustrator', 'adobe illustrator'];
  const hardNegatives = [
    'video editor',
    'video editing',
    'motion graphic',
    'motion designer',
    'motion',
    'animator',
    'animation',
    'animasi',
    '3d artist',
    '3d',
    'after effects',
    'premiere pro',
    'premiere',
    'blender',
    'cinema 4d',
    'maya',
    'autodesk',
  ];
  const roleNegatives = [
    'sales',
    'admin',
    'administrator',
    'administrative',
    'magang',
    'internship',
    'intern',
  ];

  const redFlags: string[] = [];

  for (const term of photoshopTerms) if (hasTerm(haystack, term)) score += 15;
  for (const term of roleTerms) if (hasTerm(haystack, term)) score += 12;
  for (const term of domainTerms) if (hasTerm(haystack, term)) score += 6;
  for (const term of supportingTools) if (hasTerm(haystack, term)) score += 6;
  for (const term of minorTools) if (hasTerm(haystack, term)) score += 3;

  for (const term of softNegatives) {
    if (hasTerm(haystack, term)) {
      score -= 8;
      redFlags.push(term);
    }
  }
  for (const term of hardNegatives) {
    if (hasTerm(haystack, term)) {
      score -= 20;
      redFlags.push(term);
    }
  }
  for (const term of roleNegatives) {
    if (hasTerm(haystack, term)) {
      const isEarlyCareer = term === 'magang' || term === 'intern' || term === 'internship';
      score -= isEarlyCareer ? 12 : 18;
      redFlags.push(term);
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    redFlags: [...new Set(redFlags)],
  };
}

export function parseJobstreetCard(rawText: string): {
  title: string;
  company?: string;
  salary?: string;
  employmentType?: string;
  workArrangement?: string;
  location?: string;
  postedAt?: string;
} {
  const text = rawText.replace(/\s+/g, ' ').trim();

  const postedMatch = text.match(
    /Listed\s+(today|yesterday|more\s+than\s+\w+\s+days?\s+ago|\w+\s+days?\s+ago|\w+\s+hours?\s+ago)/i
  );
  const postedAt = postedMatch?.[1]?.trim();

  const employmentMatch = text.match(
    /Ini adalah lowongan kerja\s+(Full time|Part time|Contract\/Temp|Contract|Kontrak\/Temporer|Kontrak|Casual\/Vacation|Casual|Temporary|Temporer|Vacation|Freelance)/i
  );
  const employmentType = employmentMatch?.[1]?.trim();

  const salaryMatch = text.match(
    /Rp\s*[\d.,]+(?:\s*[-–]\s*Rp\s*[\d.,]+)?\s+per\s+(?:month|hour|year|day|annum|tahun|bulan|jam)/i
  );
  const salary = salaryMatch?.[0]?.trim();

  const arrangementMatch = text.match(/\((Hibrid|Hybrid|Remote|WFH|WFO)\)/i);
  const workArrangement = arrangementMatch?.[1]?.trim();

  let location: string | undefined;
  const employmentEnd = employmentMatch
    ? (employmentMatch.index ?? 0) + employmentMatch[0].length
    : -1;
  const salaryStart = salaryMatch?.index ?? -1;

  if (employmentEnd > 0 && salaryStart > employmentEnd) {
    location = text.slice(employmentEnd, salaryStart).trim();
  } else if (employmentEnd > 0) {
    const tail = text.slice(employmentEnd);
    const locationPattern =
      /^([A-Z][\w\s]{2,40}(?:,\s*[A-Z][\w\s]{2,40})?,\s*(?:Jakarta\s+Raya|Jawa\s+(?:Barat|Tengah|Timur)|Banten|DI\s+Yogyakarta|DKI\s+Jakarta|Bali|Sumatera?\s+(?:Utara|Selatan|Barat)|Sulawesi\s+(?:Selatan|Utara)|Kalimantan\s+(?:Selatan|Timur|Barat)|Riau|Lampung)(?:\((?:Hibrid|Hybrid|Remote|WFH|WFO)\))?)/;
    const match = tail.match(locationPattern);
    if (match) {
      location = match[1].trim();
    } else {
      const single = tail.match(/^([A-Z][\w\s]{2,40})/);
      if (single) {
        const candidate = single[1].trim();
        if (
          !/^(The|This|Working|Mendesain|Membuat|Create|We are|Looking|Mengeksekusi|High|Stable|Career)/i.test(
            candidate
          )
        ) {
          location = candidate;
        }
      }
    }
  } else {
    const fallback = text.match(
      /((?:Jakarta(?:\s+(?:Pusat|Selatan|Utara|Barat|Timur))?|Tangerang(?:\s+Selatan)?|Bekasi|Depok|Bogor|Bandung|Surabaya|Cempaka Putih|Mampang Prapatan|Kelapa Gading|[A-Z][\w\s]{2,30}),\s+(Jakarta\s+Raya|Jawa\s+(?:Barat|Tengah|Timur)|Banten|DI\s+Yogyakarta|DKI\s+Jakarta))/
    );
    if (fallback) location = `${fallback[1].trim()}, ${fallback[2].trim()}`;
  }

  if (location) {
    location = location
      .replace(
        /^(Full time|Part time|Kontrak\/Temporer|Kontrak|Temporer|Contract\/Temp|Contract|Casual\/Vacation|Casual|Vacation|Temporary|Freelance)\s*/i,
        ''
      )
      .replace(/\((?:Hibrid|Hybrid|Remote|WFH|WFO)\)\s*$/i, '')
      .replace(/(,\s*Jakarta\s+Raya)\s*,\s*Jakarta\s+Raya\b/i, '$1')
      .replace(/(,\s*[\w\s]+?)\s*,\s*\1\s*$/i, '$1')
      .replace(/\s+/g, ' ')
      .trim();

    if (!location || location.length < 3) location = undefined;
  }

  const titleStart = postedMatch ? (postedMatch.index ?? 0) + postedMatch[0].length : 0;
  const titleEnd = employmentMatch?.index ?? text.length;
  const titleCompanySegment = text.slice(titleStart, titleEnd).trim();

  let title = '';
  let company: string | undefined;
  const diMatch = titleCompanySegment.match(/^(.+?)di\s+(.+)$/);
  if (diMatch) {
    title = diMatch[1].trim();
    company = diMatch[2].trim();
  } else {
    title = titleCompanySegment.slice(0, 90);
  }

  title = title.replace(/\s+/g, ' ').trim().slice(0, 90);
  if (company) {
    company = company
      .replace(/(Akan segera berakhir|Dibutuhkan segera|Featured|Promoted).*$/i, '')
      .replace(/Ini adalah lowongan kerja.*$/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120);
    if (company.length < 2) company = undefined;
  }

  return {
    title,
    company,
    salary,
    employmentType,
    workArrangement,
    location,
    postedAt,
  };
}
