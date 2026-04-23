import { DM_Sans, Six_Caps } from 'next/font/google';

/**
 * Font Optimization Strategy (Next.js 16.2.2):
 * - Using next/font/google for zero-CLS font swapping.
 * - DM Sans is used for UI and body text.
 * - Six Caps is used for display and headers.
 */

export const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const sixCaps = Six_Caps({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

// Critical Font Class Names
export const displayClassName = sixCaps.variable;
export const sansClassName = dmSans.variable;

// Handwritten font stack (system fonts)
const handwrittenFontStack = `
  'Comic Sans MS', 
  'Chalkboard SE', 
  'Bradley Hand', 
  'Marker Felt', 
  'Segoe Print', 
  cursive, 
  sans-serif
`;

export const handwrittenFontVar = `--font-handwritten: ${handwrittenFontStack};`;
