export interface Label {
  id: string;
  name: string;
  slug: string;
  color?: string;
  description?: string;
}

export type LabelsData = Label[];
