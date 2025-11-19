export interface AboutHero {
  title: string;
  backgroundTrail: string[];
}

export interface AboutMotto {
  badge: string;
  quote: string;
}

export interface AboutBio {
  content: string;
  galleryImages: string[];
}

export interface AboutProfessional {
  motto: AboutMotto;
  bio: AboutBio;
}

export interface AboutSoftSkill {
  text: string;
  description: string;
}

export interface AboutSoftSkills {
  texts: string[];
  descriptions: string[];
}

export interface AboutData {
  hero: AboutHero;
  professional: AboutProfessional;
  softSkills: AboutSoftSkills;
  lastUpdated: string;
}

export interface UpdateAboutData {
  hero?: Partial<AboutHero>;
  professional?: Partial<AboutProfessional>;
  softSkills?: Partial<AboutSoftSkills>;
}
