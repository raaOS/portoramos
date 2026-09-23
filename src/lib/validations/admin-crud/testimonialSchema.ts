import { z } from 'zod';
import { entityId, requiredText, shortText } from './common';

export const chatHistoryMessageSchema = z.object({
  id: z.number().int(),
  text: z.string().max(5000),
  isMe: z.boolean(),
  time: shortText(100),
  type: z.enum(['text', 'image', 'project']).optional(),
  imageSrc: z.string().max(1000).optional(),
  projectId: z.string().max(200).optional(),
});

const testimonialBaseSchema = z.object({
  name: requiredText(120),
  notificationText: requiredText(280),
  isActive: z.boolean().optional(),
  messages: z.array(chatHistoryMessageSchema).max(100).optional(),
  projectId: z.string().trim().max(200).optional(),
  company: shortText(120).optional(),
  role: shortText(120).optional(),
  content: z.string().trim().max(5000).optional(),
});

export const createTestimonialSchema = testimonialBaseSchema;

export const updateTestimonialSchema = testimonialBaseSchema
  .partial()
  .extend({
    id: entityId(),
  })
  .refine(
    ({ id: _id, ...updates }) => Object.values(updates).some((value) => value !== undefined),
    'At least one testimonial field must be updated'
  );

export const deleteTestimonialSchema = z
  .object({
    id: entityId(),
  })
  .strict();

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;
