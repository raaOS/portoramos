export interface HardSkillConcept {
  id: string;
  title: string;
  description: string;
  order: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HardSkillConceptsData {
  concepts: HardSkillConcept[];
  lastUpdated: string;
}
