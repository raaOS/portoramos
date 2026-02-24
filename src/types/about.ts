export interface TrailItem {
  src: string;
  isActive: boolean;
  slug?: string; // Optional slug for navigation
}

export interface AboutHero {
  title: string;
  title_id?: string;
  backgroundTrail: (string | TrailItem)[];
  backgroundColor?: string;
  textColor?: string;
  ballColor?: string;
  capColor?: string;
  availability?: {
    status: 'available' | 'booked' | 'limited';
    text: string;     // e.g. "Available for new projects"
    text_id?: string; // e.g. "Tersedia untuk proyek baru"
  };
}

export interface AboutMotto {
  badge: string;
  badge_id?: string;
  quote: string;
  quote_id?: string;
}

export interface AboutBio {
  content: string;
  content_id?: string;

}

export interface AboutContacts {
  email: string;
  whatsapp: string;
  linkedin: string;
}

export interface AboutProfessional {
  contacts?: AboutContacts;
  motto: AboutMotto;
  bio: AboutBio;
}

export interface AboutSoftSkill {
  text: string;
  text_id?: string;
  description: string;
  description_id?: string;
}

export interface SoftSkillItem {
  text: string;
  description: string;
  isDraft?: boolean;
}

export interface AboutSoftSkills {
  items?: SoftSkillItem[];
  texts?: string[]; // Deprecated
  texts_id?: string[];
  descriptions?: string[]; // Deprecated
  descriptions_id?: string[];
}

export interface PhilosophyStep {
  number: string;
  title: string;
  desc: string;
  quote: string;
}

export interface DesignPhilosophy {
  heading: string;
  subheading: string;
  steps: PhilosophyStep[];
}


// OS Configuration Types
export interface Wallpaper {
  id: string;
  url: string;
  name?: string;
}

export interface WallpaperConfig {
  activeWallpaperId: string;
  collection: Wallpaper[];
  blur?: number; // 0-20px
}

export interface DesktopPreferences {
  visibleProjectIds: string[];
  maxIcons: number;
  layout: 'grid' | 'scattered';
  iconPositions?: Record<string, { x: number; y: number }>; // Saved positions
}

export interface DockItemConfig {
  label?: string;
  iconUrl?: string;
  isHidden?: boolean;
}

export interface DockPreferences {
  [key: string]: DockItemConfig;
}

export interface ChatSettings {
  autoReplyText: string;
  contactEmail: string;
  contactPhone: string;
  avatarUrl?: string;
}

export interface WindowPreference {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  isOpenByDefault?: boolean;
}

export interface WindowPreferences {
  [key: string]: WindowPreference;
}

export interface SoundSetting {
  path: string;
  volume: number;
}

export interface SoundConfig {
  [key: string]: SoundSetting;
}

export interface AboutData {
  hero: AboutHero;
  professional: AboutProfessional;
  softSkills: AboutSoftSkills;
  designPhilosophy?: DesignPhilosophy;

  // OS Configuration
  desktopPreferences?: DesktopPreferences;
  wallpaperConfig?: WallpaperConfig;
  dockConfig?: DockPreferences;
  chatSettings?: ChatSettings;
  windowPreferences?: WindowPreferences;
  islandNotifications?: AboutIslandNotification[];
  soundConfig?: SoundConfig;


  labels?: {
    experienceTitle?: string;
    experienceSubtitle?: string;
    freelanceTitle?: string;
    workExperienceTitle?: string;
    portfolioPreviewTitle?: string;
  };
  lastUpdated: string;
}

export interface UpdateAboutData {
  hero?: Partial<AboutHero>;
  professional?: Partial<AboutProfessional>;
  softSkills?: Partial<AboutSoftSkills>;
  designPhilosophy?: Partial<DesignPhilosophy>;

  // OS Configuration
  desktopPreferences?: DesktopPreferences;
  wallpaperConfig?: WallpaperConfig;
  dockConfig?: DockPreferences;
  chatSettings?: ChatSettings;
  windowPreferences?: WindowPreferences;
  islandNotifications?: AboutIslandNotification[];
  soundConfig?: SoundConfig;

  labels?: Partial<AboutData['labels']>;
}

export interface ChatMessage {
  id: number;
  text: string;
  isMe: boolean;
  time: string;
  status: 'sent' | 'read';
}

export interface AboutIslandNotification {
  id: string;
  name: string;
  message: string;
  avatar: string;
  isActive: boolean;
  conversation: ChatMessage[];
  status: string;
}

export interface ContactProfile {
  id: string;
  name: string;
  avatar: string;
  status: string;
  conversation: ChatMessage[];
}
