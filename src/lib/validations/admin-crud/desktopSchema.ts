import { z } from 'zod';
import { requiredText, shortText } from './common';

export const stickyNoteSchema = z
  .object({
    id: requiredText(120),
    text: z.string().max(5000),
    date: shortText(100),
    color: requiredText(20),
    isStarred: z.boolean(),
    isDeleted: z.boolean(),
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    xPct: z.number().min(-100).max(200).optional(),
    yPct: z.number().min(-100).max(200).optional(),
    widthPct: z.number().min(0).max(100).optional(),
    heightPct: z.number().min(0).max(100).optional(),
    refScreenWidth: z.number().optional(),
    refScreenHeight: z.number().optional(),
    isPinned: z.boolean().optional(),
    isCollapsed: z.boolean().optional(),
    opacity: z.number().min(0).max(1).optional(),
    zIndex: z.number().optional(),
    fontFamily: shortText(200).optional(),
    fontSize: z.number().min(6).max(96).optional(),
  })
  .strict();

export const stickyNotesBulkSchema = z.array(stickyNoteSchema).max(200);

export const galleryFeaturedSchema = z
  .object({
    featuredProjectIds: z.array(shortText(200).min(1)).max(100),
  })
  .strict();

export type StickyNoteInput = z.infer<typeof stickyNoteSchema>;
