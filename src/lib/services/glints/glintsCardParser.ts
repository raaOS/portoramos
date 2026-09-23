export function isBlockedPage(text: string, title: string): boolean {
  const haystack = `${title}\n${text}`.toLowerCase();
  return /firewall|access denied|captcha|verify you are human|just a moment|blocked/.test(haystack);
}

export function normalizeJobUrl(href: string): string {
  const decoded = href.replace(/&amp;/g, '&');
  const url = decoded.startsWith('http')
    ? new URL(decoded)
    : new URL(decoded, 'https://glints.com');
  url.search = '';
  return url.toString();
}

export function hasTerm(haystack: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`).test(haystack);
}

export function parseGlintsCardBlock(
  rawText: string,
  _jobUrl: string
): {
  title: string;
  company?: string;
  salary?: string;
  employmentType?: string;
  workArrangement?: string;
  category?: string;
  experienceLevel?: string;
  educationLevel?: string;
  postedAt?: string;
  updatedAt?: string;
  location?: string;
  skills?: string;
} {
  const text = rawText.replace(/\s+/g, ' ').trim();

  const salaryFullMatch = text.match(
    /Rp\s?[\d.,]+\s?(?:rb|jt)?(?:\s?[-–]\s?[\d.,]+\s?(?:rb|jt)?)?(?:\s?\/\s?(?:Bulan|Jam|Hari|Minggu|Tahun|Proyek))?/i
  );
  const salaryHiddenMatch = text.match(/Gaji\s+Tidak\s+Ditampilkan/i);
  const salaryMatch = salaryFullMatch ?? salaryHiddenMatch;
  const salary = salaryMatch?.[0]?.trim();

  const employmentMatch = text.match(
    /(Penuh Waktu|Paruh Waktu|Magang|Kontrak|Freelance)(?=[^a-zA-Z]|$)/i
  );
  const employmentType = employmentMatch?.[0];

  const arrangementMatch = text.match(/(Hybrid|Remote|Kerja di lokasi|WFO|WFH)(?=[^a-zA-Z]|$)/i);
  const workArrangement = arrangementMatch?.[0];

  const educationMatch = text.match(
    /Minimal\s+(?:SMA\/SMK|SMA|SMK|Diploma\s*\([^)]+\)|Diploma|Sarjana\s*\([^)]+\)|Sarjana|S1|S2|S3|D[1-4])/i
  );
  const educationLevel = educationMatch?.[0]?.trim();

  const dashClass = '[-–—\\u2013\\u2014]';
  const experienceFullMatch = text.match(
    new RegExp(
      `Pengalaman\\s*(?:kurang dari\\s*\\d+\\s*tahun|\\d+\\s*${dashClass}\\s*\\d+\\s*tahun|\\d+\\+?\\s*tahun|tidak diperlukan)`,
      'i'
    )
  );
  const experienceShortMatch = text.match(
    new RegExp(
      `(\\d+\\s*${dashClass}\\s*\\d+\\s*tahun|kurang dari\\s+\\d+\\s+tahun|\\d+\\+?\\s+tahun|tidak diperlukan)`,
      'i'
    )
  );
  let experienceLevel: string | undefined;
  if (experienceFullMatch) {
    experienceLevel = experienceFullMatch[0].trim();
  } else if (experienceShortMatch) {
    experienceLevel = `Pengalaman ${experienceShortMatch[1].trim()}`;
  }
  if (experienceLevel) {
    experienceLevel = experienceLevel.replace(/[\u2013\u2014]/g, '-').replace(/\s+/g, ' ');
  }

  const postedMatch = text.match(/Tayang\s+([^·•\n]+?yang lalu|hari ini|kemarin)/i);
  const updatedMatch = text.match(/Diperbarui\s+([^·•\n]+?yang lalu|hari ini|kemarin)/i);
  const postedAt = postedMatch?.[1]?.trim();
  const updatedAt = updatedMatch?.[1]?.trim();

  const skillsSearchStart = educationMatch
    ? (educationMatch.index ?? 0) + educationMatch[0].length
    : 0;
  const skillsRegion = text.slice(skillsSearchStart);
  const skillsLocalMatch = skillsRegion.match(/([A-Z][\w\s.&]{2,80}?\+\d+)/);
  const skills = skillsLocalMatch?.[1]?.trim();
  const skillsAbsoluteStart = skillsLocalMatch
    ? skillsSearchStart + (skillsLocalMatch.index ?? 0)
    : -1;
  const skillsAbsoluteEnd = skillsLocalMatch
    ? skillsAbsoluteStart + skillsLocalMatch[0].length
    : -1;

  const cityProvinceMatch = text.match(
    /((?:Kab\.|Kota)?\s*(?:Jakarta|Tangerang|Bekasi|Depok|Bogor|Bandung|Surabaya|Yogyakarta|Bali|Denpasar|Medan|Semarang|Malang|Makassar|Batam|Solo|Sidoarjo|Pekanbaru|Padang|Pontianak|Banjarmasin|Balikpapan|Samarinda|Manado|Palembang|Lampung)(?:\s+(?:Pusat|Selatan|Utara|Barat|Timur))?),\s*((?:DI\s+|DKI\s+)?(?:Yogyakarta|Jakarta|Jawa\s+(?:Barat|Tengah|Timur)|Sumatra\s+(?:Utara|Selatan|Barat)|Sumatera\s+(?:Utara|Selatan|Barat)|Bali|Banten|Sulawesi\s+(?:Selatan|Utara)|Kalimantan\s+(?:Selatan|Timur|Barat)|Riau|Lampung))/i
  );
  const cityOnlyMatch = text.match(
    /\b(Jakarta(?:\s+(?:Pusat|Selatan|Utara|Barat|Timur))?|Tangerang(?:\s+Selatan)?|Bekasi|Depok|Bogor|Bandung|Surabaya|Yogyakarta|Bali|Denpasar|Medan|Semarang|Malang|Makassar|Batam|Kab\.\s+\w+|Kota\s+\w+)\b/i
  );
  let location: string | undefined;
  if (cityProvinceMatch) {
    location = `${cityProvinceMatch[1].replace(/\s+/g, ' ').trim()}, ${cityProvinceMatch[2].trim()}`;
  } else if (cityOnlyMatch) {
    location = cityOnlyMatch[0];
  }

  const cutIndices = [
    salaryMatch?.index,
    employmentMatch?.index,
    arrangementMatch?.index,
    educationMatch?.index,
    experienceFullMatch?.index,
    experienceShortMatch?.index,
    postedMatch?.index,
    updatedMatch?.index,
    skillsAbsoluteStart >= 0 ? skillsAbsoluteStart : undefined,
  ].filter((value): value is number => typeof value === 'number');
  const headEnd = cutIndices.length > 0 ? Math.min(...cutIndices) : Math.min(text.length, 140);
  const head = text.slice(0, headEnd).trim();
  const title = head
    .replace(/Perusahaan Premium/gi, '')
    .trim()
    .slice(0, 90);

  let company: string | undefined;
  const locationIndex = cityProvinceMatch?.index ?? cityOnlyMatch?.index;
  const lastSignalEnd = Math.max(
    skillsAbsoluteEnd,
    educationMatch ? (educationMatch.index ?? 0) + educationMatch[0].length : -1,
    experienceFullMatch ? (experienceFullMatch.index ?? 0) + experienceFullMatch[0].length : -1,
    experienceShortMatch ? (experienceShortMatch.index ?? 0) + experienceShortMatch[0].length : -1,
    updatedMatch ? (updatedMatch.index ?? 0) + updatedMatch[0].length : -1,
    postedMatch ? (postedMatch.index ?? 0) + postedMatch[0].length : -1,
    employmentMatch ? (employmentMatch.index ?? 0) + employmentMatch[0].length : -1,
    arrangementMatch ? (arrangementMatch.index ?? 0) + arrangementMatch[0].length : -1
  );

  if (lastSignalEnd > 0 && typeof locationIndex === 'number' && locationIndex > lastSignalEnd) {
    const slice = text.slice(lastSignalEnd, locationIndex).trim();
    const cleaned = slice
      .replace(/^Perusahaan\s+Premium/i, '')
      .replace(/^[,·•]+/, '')
      .replace(/^Verified\s+/i, '')
      .trim();
    if (cleaned.length > 1 && cleaned.length < 120) {
      company = cleaned;
    }
  }

  if (!company) {
    const ptMatch = text.match(
      /\b((?:PT|CV|UD|PD)\.?\s+[A-Z][\w\s&\-.()'"]{2,80}?)(?=\s+(?:Yogyakarta|Jakarta|Tangerang|Bekasi|Depok|Bogor|Bandung|Surabaya|Bali|Medan|Semarang|Malang|Makassar|Batam|Sidoarjo|Kab\.|Kota|$))/
    );
    if (ptMatch) company = ptMatch[1].trim();
  }

  return {
    title,
    company,
    salary,
    employmentType,
    workArrangement,
    category: undefined,
    experienceLevel,
    educationLevel,
    postedAt,
    updatedAt,
    location,
    skills,
  };
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
    'image editing',
  ];

  const roleTerms = [
    'graphic designer',
    'graphic design',
    'visual designer',
    'visual design',
    'social media designer',
    'sosmed designer',
    'desainer grafis',
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

  for (const term of photoshopTerms) {
    if (hasTerm(haystack, term)) score += 15;
  }
  for (const term of roleTerms) {
    if (hasTerm(haystack, term)) score += 12;
  }
  for (const term of domainTerms) {
    if (hasTerm(haystack, term)) score += 6;
  }
  for (const term of supportingTools) {
    if (hasTerm(haystack, term)) score += 6;
  }
  for (const term of minorTools) {
    if (hasTerm(haystack, term)) score += 3;
  }

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
