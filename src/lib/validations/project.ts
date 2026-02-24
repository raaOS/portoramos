
import { z } from 'zod';

export const GalleryItemSchema = z.object({
    kind: z.enum(['image', 'video']),
    src: z.string(),
    alt: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    isActive: z.boolean().optional(),
    poster: z.string().optional(),
});

export const NarrativeSchema = z.object({
    context: z.string().nullable().optional(),
    challenge: z.string().nullable().optional(),
    solution: z.string().nullable().optional(),
    impact: z.string().nullable().optional(),
    result: z.string().nullable().optional(),
    concept: z.string().nullable().optional(),
    process: z.string().nullable().optional(),
    detail: z.string().nullable().optional(),
});

export const ComparisonSchema = z.object({
    beforeImage: z.string(),
    beforeType: z.enum(['image', 'video']).optional(),
    afterImage: z.string(),
    afterType: z.enum(['image', 'video']).optional(),
});

export const ProjectSchema = z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string().min(1, "Title is required"),
    client: z.string().min(1, "Client is required"),
    year: z.union([z.string(), z.number()]),
    tags: z.array(z.string()).default([]),
    description: z.string(),
    description_id: z.string().optional(),
    title_id: z.string().optional(),
    cover: z.string().min(1, "Cover image is required"),
    coverWidth: z.number().default(800),
    coverHeight: z.number().default(600),
    autoplay: z.boolean().default(false),
    muted: z.boolean().default(true),
    loop: z.boolean().default(false),
    playsInline: z.boolean().default(true),
    likes: z.number().default(0),
    shares: z.number().default(0),
    allowComments: z.boolean().default(true),
    status: z.enum(['published', 'draft']).default('published'),

    // New Fields
    role: z.string().optional(),
    timeline: z.string().optional(),
    team: z.string().optional(),
    software: z.array(z.string()).optional(),
    type: z.enum(['commercial', 'visual_art']).optional(),

    narrative: NarrativeSchema.optional(),
    comparison: ComparisonSchema.optional(),

    gallery: z.array(z.string()).optional(),
    galleryItems: z.array(GalleryItemSchema).optional(),

    initialCommentCount: z.number().optional(),
    order: z.number().default(0),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const CreateProjectSchema = ProjectSchema.omit({
    id: true,
    slug: true,
    createdAt: true,
    updatedAt: true,
    order: true
}).extend({
    initialCommentCount: z.number().optional()
});

export const UpdateProjectSchema = CreateProjectSchema.partial().extend({
    id: z.string(),
    slug: z.string().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;
