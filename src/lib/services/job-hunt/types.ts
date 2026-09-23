export interface JobSearchResult {
  title: string;
  company?: string;
  location?: string;
  source: string;
  url: string;
  snippet?: string;
  score?: number;
  redFlags?: string[];
  salary?: string;
  employmentType?: string;
  workArrangement?: string;
  category?: string;
  experienceLevel?: string;
  educationLevel?: string;
  postedAt?: string;
  updatedAt?: string;
  skills?: string;
}

export interface JobSearchResponse {
  query: string;
  results: JobSearchResult[];
  searchLinks: Array<{ label: string; url: string }>;
  analysis: string;
}

export interface ApplyPackage {
  proposal: string;
  hrMessage: string;
  analysis: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
  sourceText: string;
}
