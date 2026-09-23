import { z } from 'zod';
import { requiredText, shortText } from './common';

const trailItemSchema = z
  .object({
    src: requiredText(1000),
    isActive: z.boolean(),
    slug: shortText(200).optional(),
  })
  .strict();

const aboutAvailabilitySchema = z
  .object({
    status: z.enum(['available', 'booked', 'limited']),
    text: requiredText(200),
    text_id: shortText(200).optional(),
  })
  .strict();

const aboutHeroSchema = z
  .object({
    title: requiredText(200),
    title_id: shortText(200).optional(),
    backgroundTrail: z.array(z.union([shortText(1000), trailItemSchema])).max(100),
    backgroundColor: shortText(50).optional(),
    textColor: shortText(50).optional(),
    ballColor: shortText(50).optional(),
    capColor: shortText(50).optional(),
    availability: aboutAvailabilitySchema.optional(),
  })
  .strict();

const aboutContactsSchema = z
  .object({
    email: shortText(200),
    whatsapp: shortText(50),
    linkedin: shortText(200),
  })
  .strict();

const aboutMottoSchema = z
  .object({
    badge: requiredText(200),
    badge_id: shortText(200).optional(),
    quote: requiredText(1000),
    quote_id: shortText(1000).optional(),
  })
  .strict();

const aboutBioSchema = z
  .object({
    content: requiredText(10000),
    content_id: shortText(10000).optional(),
  })
  .strict();

const aboutProfessionalSchema = z
  .object({
    contacts: aboutContactsSchema.optional(),
    motto: aboutMottoSchema,
    bio: aboutBioSchema,
  })
  .strict();

const softSkillItemSchema = z
  .object({
    text: requiredText(200),
    description: requiredText(1000),
    isDraft: z.boolean().optional(),
  })
  .strict();

const aboutSoftSkillsSchema = z
  .object({
    items: z.array(softSkillItemSchema).max(100).optional(),
    texts: z.array(shortText(200)).max(100).optional(),
    texts_id: z.array(shortText(200)).max(100).optional(),
    descriptions: z.array(shortText(1000)).max(100).optional(),
    descriptions_id: z.array(shortText(1000)).max(100).optional(),
  })
  .strict();

const workflowSubStepSchema = z
  .object({
    id: requiredText(120),
    title: requiredText(200),
    description: requiredText(1000),
    status: z.enum(['default', 'in-progress', 'completed', 'pending']).optional(),
  })
  .strict();

export const workflowStepSchema = z
  .object({
    id: requiredText(120),
    number: requiredText(20),
    title: requiredText(200),
    subtitle: requiredText(200),
    description: requiredText(1000),
    type: z.enum(['phase', 'decision', 'terminator']),
    color: z.enum(['amber', 'blue', 'purple', 'rose', 'emerald']),
    icon: requiredText(120),
    subSteps: z.array(workflowSubStepSchema).max(50),
    nextSteps: z.array(shortText(120)).max(20),
    loopTargets: z.array(shortText(120)).max(20),
  })
  .strict();

export const designPhilosophySchema = z
  .object({
    heading: requiredText(200),
    subheading: requiredText(1000),
    workflowSteps: z.array(workflowStepSchema).max(50),
  })
  .strict();

const desktopIconPositionSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    zIndex: z.number().optional(),
    size: z.enum(['small', 'medium', 'large']).optional(),
    xPct: z.number().min(-100).max(200).optional(),
    yPct: z.number().min(-100).max(200).optional(),
    refScreenWidth: z.number().positive().optional(),
    refScreenHeight: z.number().positive().optional(),
  })
  .strict();

const desktopPreferencesSchema = z
  .object({
    visibleProjectIds: z.array(shortText(200)).max(100),
    maxIcons: z.coerce.number().int().min(1).max(100),
    layout: z.enum(['grid', 'scattered']),
    iconPositions: z.record(z.string(), desktopIconPositionSchema).optional(),
  })
  .strict();

export const wallpaperSchema = z
  .object({
    id: requiredText(120),
    url: requiredText(1000),
    name: shortText(200).optional(),
    type: z.enum(['image', 'video']).optional(),
    posterUrl: shortText(1000).optional(),
    startTime: z.coerce.number().min(0).max(250).optional(),
  })
  .strict();

const wallpaperConfigSchema = z
  .object({
    activeWallpaperId: z.string().trim().max(120),
    collection: z.array(wallpaperSchema).max(100),
    blur: z.coerce.number().min(0).max(20).optional(),
  })
  .strict();

const dockItemConfigSchema = z
  .object({
    label: shortText(120).optional(),
    iconUrl: z.string().trim().max(1000).optional(),
    isHidden: z.boolean().optional(),
    order: z.coerce.number().int().optional(),
  })
  .strict();

const windowPreferenceSchema = z
  .object({
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    zIndex: z.number().optional(),
    xPct: z.number().min(0).max(100).optional(),
    yPct: z.number().min(0).max(100).optional(),
    widthPct: z.number().min(0).max(100).optional(),
    heightPct: z.number().min(0).max(100).optional(),
    refScreenWidth: z.number().optional(),
    refScreenHeight: z.number().optional(),
    isOpenByDefault: z.boolean().optional(),
  })
  .strict();

const soundSettingSchema = z
  .object({
    path: requiredText(1000),
    volume: z.coerce.number().min(0).max(1),
  })
  .strict();

const islandChatMessageSchema = z
  .object({
    id: z.number().int(),
    text: requiredText(2000),
    isMe: z.boolean(),
    time: requiredText(100),
    status: z.enum(['sent', 'read']),
  })
  .strict();

const islandNotificationSchema = z
  .object({
    id: requiredText(120),
    name: requiredText(120),
    message: requiredText(1000),
    avatar: requiredText(1000),
    isActive: z.boolean(),
    conversation: z.array(islandChatMessageSchema).max(100),
    status: requiredText(120),
  })
  .strict();

const aboutLabelsSchema = z
  .object({
    experienceTitle: shortText(200).optional(),
    experienceSubtitle: shortText(200).optional(),
    freelanceTitle: shortText(200).optional(),
    workExperienceTitle: shortText(200).optional(),
    portfolioPreviewTitle: shortText(200).optional(),
  })
  .strict();

export const updateAboutSchema = z
  .object({
    hero: aboutHeroSchema.partial().optional(),
    professional: aboutProfessionalSchema.partial().optional(),
    softSkills: aboutSoftSkillsSchema.partial().optional(),
    designPhilosophy: designPhilosophySchema.partial().optional(),
    desktopPreferences: desktopPreferencesSchema.partial().optional(),
    wallpaperConfig: wallpaperConfigSchema.optional(),
    dockConfig: z.record(z.string(), dockItemConfigSchema).optional(),
    windowPreferences: z.record(z.string(), windowPreferenceSchema).optional(),
    islandNotifications: z.array(islandNotificationSchema).max(100).optional(),
    soundConfig: z.record(z.string(), soundSettingSchema).optional(),
    labels: aboutLabelsSchema.optional(),
  })
  .strict()
  .refine(
    (payload) => Object.values(payload).some((value) => value !== undefined),
    'At least one about field must be updated'
  );

export const updateDesignPhilosophySchema = z
  .object({
    heading: requiredText(200),
    subheading: requiredText(1000),
    workflowSteps: z.array(workflowStepSchema).max(50),
  })
  .strict();

export type UpdateAboutInput = z.infer<typeof updateAboutSchema>;
export type UpdateDesignPhilosophyInput = z.infer<typeof updateDesignPhilosophySchema>;
