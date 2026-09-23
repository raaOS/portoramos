import type { ApplyResult, ParsedJob, TailoredResume } from './job-apply/types';
import { parseJob, buildPdfFilename } from './job-apply/jobApplyParser';
import {
  fallbackAnalysis,
  fallbackHrMessage,
  fallbackProposal,
  tryAiApply,
  tailorResumeContent,
} from './job-apply/jobApplyTemplates';
import { generateBasicPdf } from './job-apply/jobApplyPdfGenerator';

export type { ApplyResult, ParsedJob, TailoredResume };

export const jobApplyService = {
  async prepare(jobText: string): Promise<ApplyResult> {
    const job = parseJob(jobText);

    // Run text-output AI and resume-tailoring AI in parallel
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
