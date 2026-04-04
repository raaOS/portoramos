/**
 * Validation Schemas Barrel Export
 * 
 * Centralized exports for all Zod validation schemas.
 * Usage: import { commentSchema, ProjectSchema } from '@/lib/validations';
 */

// Project-related validations
export {
    GalleryItemSchema,
    GalleryGroupSchema,
    NarrativeSchema,
    ComparisonSchema,
    ProjectSchema,
    CreateProjectSchema,
    UpdateProjectSchema,
    type Project,
} from './project';

// Comment and other validations from schemas.ts
export {
    projectTechnologySchema,
    projectGalleryItemSchema,
    projectComparisonSchema,
    createProjectSchema,
    updateProjectSchema,
    commentSchema,
    validateCommentDepth,
    createCommentSchema,
    uploadFileSchema,
    updateContactSchema,
    updateSettingsSchema,
    compressFileSchema,
    deleteIconSchema,
    telegramWebhookSchema,
    telegramStatusSchema,
    type CreateProjectInput,
    type UpdateProjectInput,
    type CreateCommentInput,
    type UploadFileInput,
    type CompressFileInput,
    type DeleteIconInput,
    type TelegramWebhookInput,
    type TelegramStatusInput,
} from './schemas';

export {
    chatHistoryMessageSchema,
    createTestimonialSchema,
    updateTestimonialSchema,
    deleteTestimonialSchema,
    experienceStatisticsSchema,
    workExperienceSchema,
    updateExperienceSchema,
    runningTextItemSchema,
    createRunningTextSchema,
    bulkUpdateRunningTextSchema,
    updateRunningTextSchema,
    updateAboutSchema,
    type CreateTestimonialInput,
    type UpdateTestimonialInput,
    type UpdateExperienceInput,
    type CreateRunningTextInput,
    type UpdateRunningTextInput,
    type UpdateAboutInput,
} from './adminCrud';
