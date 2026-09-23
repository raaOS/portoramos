import { z } from 'zod';
import { requiredText, shortText } from './common';

export const experienceStatisticsSchema = z.object({
  years: requiredText(50),
  projects: requiredText(50),
  designTools: requiredText(50),
  clientSatisfaction: requiredText(50),
});

export const workExperienceSchema = z.object({
  id: requiredText(120),
  year: requiredText(50),
  duration: requiredText(50),
  company: requiredText(120),
  position: requiredText(120),
  position_id: shortText(120).optional(),
  description: z.array(requiredText(500)).max(20),
  description_id: z.array(shortText(500)).max(20).optional(),
  imageUrl: z.string().trim().max(1000),
  isActive: z.boolean().optional(),
});

export const updateExperienceSchema = z
  .object({
    statistics: experienceStatisticsSchema.optional(),
    workExperience: z.array(workExperienceSchema).max(100).optional(),
  })
  .strict()
  .refine(
    (payload) => payload.statistics !== undefined || payload.workExperience !== undefined,
    'At least one experience field must be updated'
  );

export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;
