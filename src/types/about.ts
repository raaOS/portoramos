export interface TrailItem {
  src: string;
  isActive: boolean;
  slug?: string; // Optional slug for navigation
}

export interface AboutHero {
  title: string;
  title_id?: string;
  backgroundTrail: (string | TrailItem)[];
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
  galleryImages: (string | TrailItem)[];
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

export interface AboutSoftSkills {
  texts: string[];
  texts_id?: string[];
  descriptions: string[];
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

export interface AboutData {
  hero: AboutHero;
  professional: AboutProfessional;
  softSkills: AboutSoftSkills;
  designPhilosophy?: DesignPhilosophy;
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
}
