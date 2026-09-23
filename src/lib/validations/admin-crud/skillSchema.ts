import { z } from 'zod';
import { requiredText, shortText } from './common';

const hardSkillLevelSchema = z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']);

export const hardSkillSchema = z
  .object({
    id: requiredText(120),
    name: requiredText(120),
    iconUrl: requiredText(1000),
    level: hardSkillLevelSchema,
    order: z.coerce.number().int().min(0).max(10000),
    description: shortText(1000).optional(),
    description_id: shortText(1000).optional(),
    isActive: z.boolean().optional(),
    details: z.array(shortText(500)).max(50).optional(),
    createdAt: shortText(100),
    updatedAt: shortText(100),
  })
  .strict();

export const bulkUpdateHardSkillsSchema = z.array(hardSkillSchema).max(200);

export const updateHardSkillSchema = hardSkillSchema
  .partial()
  .omit({ id: true, createdAt: true })
  .strict()
  .refine(
    (payload) => Object.values(payload).some((value) => value !== undefined),
    'At least one hard skill field must be updated'
  );

const hardSkillConceptBaseSchema = z.object({
  title: requiredText(200),
  description: requiredText(2000),
  iconUrl: shortText(1000).optional(),
  order: z.coerce.number().int().min(0).max(10000).optional(),
  isActive: z.boolean().optional(),
});

export const createHardSkillConceptSchema = hardSkillConceptBaseSchema.strict();

export const updateHardSkillConceptSchema = hardSkillConceptBaseSchema
  .partial()
  .strict()
  .refine(
    (payload) => Object.values(payload).some((value) => value !== undefined),
    'At least one concept field must be updated'
  );

export type HardSkillInput = z.infer<typeof hardSkillSchema>;
export type UpdateHardSkillInput = z.infer<typeof updateHardSkillSchema>;
