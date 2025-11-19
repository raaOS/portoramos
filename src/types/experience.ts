export interface ExperienceData {
  statistics: {
    years: string;
    projects: string;
    designTools: string;
    clientSatisfaction: string;
  };
  workExperience: Array<{
    year: string;
    duration: string;
    company: string;
    position: string;
    description: string[];
    imageUrl: string;
  }>;
  lastUpdated: string;
}

export interface CreateExperienceData {
  statistics: {
    years: string;
    projects: string;
    designTools: string;
    clientSatisfaction: string;
  };
  workExperience: Array<{
    year: string;
    duration: string;
    company: string;
    position: string;
    description: string[];
    imageUrl: string;
  }>;
}

export interface UpdateExperienceData {
  id: string;
  year: string;
  duration: string;
  company: string;
  position: string;
  description: string[];
  imageUrl: string;
}

export interface Statistics {
  years: string;
  projects: string;
  designTools: string;
  clientSatisfaction: string;
}
