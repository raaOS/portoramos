import type { SoftwareCategory } from './types';

export const DEFAULT_VISIBLE_SOFTWARE = ['photoshop'];

export const ALL_SOFTWARE_CATEGORIES: SoftwareCategory[] = [
  {
    title: 'Adobe Creative Cloud',
    items: [
      'photoshop',
      'illustrator',
      'indesign',
      'premiere',
      'aftereffects',
      'lightroom',
      'xd',
      'acrobat',
      'audition',
      'animate',
      'dreamweaver',
    ],
  },
  {
    title: 'Desain & UI/UX',
    items: ['figma', 'sketch', 'affinity_designer', 'affinity_photo', 'affinity_publisher', 'canva'],
  },
  {
    title: 'Video & Audio Editing',
    items: ['capcut', 'finalcut', 'davinci'],
  },
  {
    title: 'AI Assistants',
    items: ['chatgpt', 'claude', 'gemini', 'kimi'],
  },
  {
    title: 'Programming & Web',
    items: ['code', 'javascript', 'typescript', 'react', 'python'],
  },
  {
    title: 'Showcase & Lainnya',
    items: ['brand', 'typography', 'social', 'motion', 'web', 'ui', 'ux', 'design'],
  },
];
