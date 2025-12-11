export type HardSkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface HardSkill {
  id: string;
  name: string;
  iconUrl: string;
  level: HardSkillLevel;
  order: number;
  description?: string;
  description_id?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HardSkillsData {
  skills: HardSkill[];
  lastUpdated: string;
}
