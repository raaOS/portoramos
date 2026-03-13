/**
 * Types Barrel Export
 * 
 * Centralized exports for all type definitions.
 * Usage: import { AboutData, Project, ContactData } from '@/types';
 */

// About types (excluding ChatMessage which is in chat.ts)
export type {
  AboutHero,
  AboutMotto,
  AboutBio,
  AboutContacts,
  AboutProfessional,
  AboutSoftSkill,
  SoftSkillItem,
  AboutSoftSkills,
  // PhilosophyStep removed - use WorkflowStep
  WorkflowSubStep,
  WorkflowStep,
  DesignPhilosophy,
  Wallpaper,
  WallpaperConfig,
  DesktopPreferences,
  DockItemConfig,
  DockPreferences,
  WindowPreference,
  WindowPreferences,
  SoundSetting,
  SoundConfig,
  AboutData,
  UpdateAboutData,
  AboutIslandNotification,
  ContactProfile,
  TrailItem
} from './about';

// Chat types (single source of truth for ChatMessage)
export * from './chat';

// Other types
export * from './contact';
// Note: './content' is excluded as it contains deprecated/duplicate types
export * from './experience';
export * from './gallery';
export * from './hardSkill';
export * from './hardSkillConcept';
export * from './projects';
export * from './runningText';
export * from './testimonial';
export * from './ui';
