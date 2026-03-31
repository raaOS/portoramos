
import { z } from 'zod';

const nullableOptionalString = z.preprocess(
    value => value === null ? undefined : value,
    z.string().optional()
);

export const GalleryItemSchema = z.object({
    kind: z.enum(['image', 'video']),
    src: z.string(),
    alt: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    isActive: z.boolean().optional(),
    poster: z.string().optional(),
});

export const GalleryGroupSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Group name is required"),
    description: z.string().optional(),
    items: z.array(GalleryItemSchema),
});

export const NarrativeSchema = z.object({
    context: nullableOptionalString,
    challenge: nullableOptionalString,
    solution: nullableOptionalString,
    impact: nullableOptionalString,
    result: nullableOptionalString,
    concept: nullableOptionalString,
    process: nullableOptionalString,
    detail: nullableOptionalString,
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
    year: z.number(),
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
    galleryGroups: z.array(GalleryGroupSchema).optional(),

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
    id: z.string(), // Required untuk update operation
    slug: z.string().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;
