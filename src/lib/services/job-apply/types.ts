export interface ApplyResult {
  proposal: string;
  hrMessage: string;
  analysis: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
}

export interface ParsedJob {
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

export interface TailoredResume {
  summary: string;
  skills: string[];
  experience: Array<{ position: string; year: string; company: string; bullets: string[] }>;
}
