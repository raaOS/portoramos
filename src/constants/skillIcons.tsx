/**
 * Skill Icons Map — Mapping nama skill ke komponen ikon visual.
 *
 * Menyediakan fungsi `getIconMap()` yang mengembalikan record icon React
 * untuk ditampilkan di komponen CV, About, dan skill showcase.
 *
 * @module constants/skillIcons
 */
import React from 'react';
import { getAdobeIcons } from './skill-icons/adobeIcons';
import { getDesignDevIcons } from './skill-icons/designDevIcons';

export const getIconMap = (className: string): Record<string, React.ReactNode> => ({
  ...getAdobeIcons(className),
  ...getDesignDevIcons(className),
});
