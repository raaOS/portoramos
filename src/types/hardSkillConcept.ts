export interface HardSkillConcept {
  id: string;
  title: string;
  title_id?: string;
  description: string;
  description_id?: string;
  order: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HardSkillConceptsData {
  concepts: HardSkillConcept[];
  lastUpdated: string;
}
