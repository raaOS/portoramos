/**
 * Fallback Content for About Page
 * Centralized content management for better maintainability
 *
 * Catatan: hanya `FALLBACK_HARD_SKILL_CONCEPTS` yang aktif dipakai, oleh
 * `hardSkillConceptService.ts`. Fallback untuk work experience dan hard
 * skills sudah dipindahkan ke JSON langsung (`@/data/experience.json`,
 * `@/data/hardSkills.json`) yang di-load oleh masing-masing service.
 * Konstanta dummy lama dihapus untuk hindari confusion source-of-truth.
 */

import { HardSkillConcept } from '@/types/hardSkillConcept';

export const FALLBACK_HARD_SKILL_CONCEPTS: HardSkillConcept[] = [
  {
    id: 'concept-typography',
    title: 'Tipografi',
    description: 'memahami jenis huruf, hierarki teks, dan readability',
    order: 1,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'concept-color',
    title: 'Teori warna',
    description: 'color psychology, color harmony, kontras, dan palet warna',
    order: 2,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'concept-layout',
    title: 'Layout & Grid System',
    description: 'mengatur komposisi visual agar rapi, seimbang, dan mudah dibaca',
    order: 3,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'concept-branding',
    title: 'Branding & Identitas Visual',
    description: 'membuat logo, guideline brand, desain konsisten untuk bisnis',
    order: 4,
    createdAt: '',
    updatedAt: '',
  },
];
