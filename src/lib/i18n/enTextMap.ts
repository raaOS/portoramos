/**
 * Static Indonesian → English text map for portfolio content.
 * Data-only module, separated from contentLocalization.ts logic.
 */
import { EN_GENERAL_TEXT } from './en-dictionaries/enGeneralText';
import { EN_PROJECTS_TEXT } from './en-dictionaries/enProjectsText';
import { EN_EXPERIENCE_WORKFLOW_TEXT } from './en-dictionaries/enExperienceWorkflowText';

export const EN_TEXT: Record<string, string> = {
  ...EN_GENERAL_TEXT,
  ...EN_PROJECTS_TEXT,
  ...EN_EXPERIENCE_WORKFLOW_TEXT,
};
