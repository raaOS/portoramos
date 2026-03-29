import { z } from 'zod';

/**
 * Comprehensive Zod Validation Schemas
 * Prevents injection attacks, validates data types, and enforces business rules
 */

// Helper: Limit nested object depth (reserved for future use)
// const MAX_DEPTH = 5;



// Project Schemas
export const projectTechnologySchema = z.string()
    .min(1, 'Technology name cannot be empty')
    .max(50, 'Technology name too long (max 50 characters)')
    .trim();

export const projectGalleryItemSchema = z.object({
    kind: z.enum(['image', 'video']),
    src: z.string().url('Invalid URL format').max(500, 'URL too long'),
    alt: z.string().max(200).optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
    poster: z.string().url().max(500).optional(),
}).strict();

export const projectComparisonSchema = z.object({
    beforeImage: z.string().max(500, 'Image URL too long'),
    afterImage: z.string().max(500, 'Image URL too long'),
    beforeLabel: z.string().max(100).optional(),
    afterLabel: z.string().max(100).optional(),
}).strict();

export const createProjectSchema = z.object({
    title: z.string()
        .min(1, 'Title is required')
        .max(200, 'Title too long (max 200 characters)')
        .trim(),

    client: z.string()
        .min(1, 'Client is required')
        .max(100, 'Client name too long')
        .trim(),

    year: z.number()
        .int('Year must be an integer')
        .min(1900, 'Year must be after 1900')
        .max(2100, 'Year must be before 2100'),

    tags: z.array(z.string().max(50))
        .max(50, 'Too many tags (max 50)')
        .default([]),

    description: z.string()
        .max(5000, 'Description too long (max 5000 characters)')
        .default(''),

    cover: z.string()
        .max(500, 'Cover URL too long')
        .default(''),

    role: z.string()
        .max(100, 'Role too long')
        .optional(),

    technologies: z.array(projectTechnologySchema)
        .max(50, 'Too many technologies (max 50)')
        .optional(),

    gallery: z.array(z.string().url().max(500))
        .max(100, 'Too many gallery items (max 100)')
        .optional(),

    galleryItems: z.array(projectGalleryItemSchema)
        .max(100, 'Too many gallery items (max 100)')
        .optional(),

    comparison: projectComparisonSchema.optional(),

    url: z.string()
        .url('Invalid project URL')
        .max(500, 'URL too long')
        .optional(),

    status: z.enum(['draft', 'published'])
        .default('published'),

    featured: z.boolean().optional(),

    autoplay: z.boolean().optional(),
    muted: z.boolean().optional(),
    loop: z.boolean().optional(),
    playsInline: z.boolean().optional(),
    coverWidth: z.number().int().positive().optional(),
    coverHeight: z.number().int().positive().optional(),

    initialCommentCount: z.number()
        .int()
        .min(0)
        .max(100, 'Too many initial comments')
        .optional(),
}).strict();

export const updateProjectSchema = createProjectSchema.partial().extend({
    id: z.string().min(1, 'Project ID is required')
});

// Comment Schemas
const MAX_COMMENT_DEPTH = 3;

const baseCommentSchema = z.object({
    id: z.string().min(1),
    text: z.string().max(1000, 'Comment too long (max 1000 characters)').optional(),
    comment: z.string().max(1000, 'Comment too long').optional(),
    name: z.string().max(100, 'Name too long').optional(),
    author: z.string().max(100, 'Author name too long').optional(),
    time: z.string().optional(),
    createdAt: z.string().optional(),
    likes: z.number().int().min(0).optional(),
    likedByMe: z.boolean().optional(),
});

type CommentType = z.infer<typeof baseCommentSchema> & {
    replies?: CommentType[];
};

export const commentSchema: z.ZodType<CommentType> = baseCommentSchema.extend({
    replies: z.lazy(() => z.array(commentSchema).max(50, 'Too many replies')).optional()
}) as z.ZodType<CommentType>;

// Validate comment depth
export function validateCommentDepth(comment: CommentType, depth: number = 0): boolean {
    if (depth > MAX_COMMENT_DEPTH) {
        return false;
    }

    if (comment.replies && Array.isArray(comment.replies)) {
        return comment.replies.every((reply: CommentType) =>
            validateCommentDepth(reply, depth + 1)
        );
    }

    return true;
}

export const createCommentSchema = z.object({
    slug: z.string().min(1, 'Slug is required').max(200),
    comments: z.array(commentSchema).max(1000, 'Too many comments'),
    website_url: z.string().max(0, 'Honeypot triggered').optional(), // Honeypot field
}).strict();

// Upload Schemas
export const uploadFileSchema = z.object({
    filename: z.string()
        .max(100, 'Filename too long')
        .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid filename characters')
        .refine(name => !name.startsWith('.'), 'Filename cannot start with dot')
        .refine(name => !name.includes('..'), 'Path traversal not allowed')
        .optional(),

    folder: z.enum(['temp', 'comparisons', 'projects', 'wallpapers', 'icons-library'])
        .optional(),
});

// Contact Schemas
export const updateContactSchema = z.object({
    content: z.record(z.string(), z.unknown()).optional(),
    info: z.record(z.string(), z.unknown()).optional(),
    formSettings: z.record(z.string(), z.unknown()).optional(),
}).strict();

// Settings Schemas
export const updateSettingsSchema = z.object({
    bannedWords: z.array(z.string().max(50)).max(1000).optional(),
    maintenanceMode: z.boolean().optional(),
    allowComments: z.boolean().optional(),
}).passthrough(); // Allow additional fields for flexibility

// Admin Operation Schemas
export const compressFileSchema = z.object({
    filePath: z.string().min(1, 'File path is required')
}).strict();

export const deleteIconSchema = z.object({
    url: z.string().min(1, 'URL is required')
}).strict();

export const telegramWebhookSchema = z.object({
    url: z.string().url('Invalid webhook URL')
}).strict();

export const telegramStatusSchema = z.object({
    token: z.string().min(1, 'Bot token is required')
}).strict();

// Export type inference
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type CompressFileInput = z.infer<typeof compressFileSchema>;
export type DeleteIconInput = z.infer<typeof deleteIconSchema>;
export type TelegramWebhookInput = z.infer<typeof telegramWebhookSchema>;
export type TelegramStatusInput = z.infer<typeof telegramStatusSchema>;
