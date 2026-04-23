/**
 * Font Optimization Strategy (Solid Fix for Compiler Compatibility):
 * - Replaced next/font with standard CSS loading to bypass SWC compiler crashes on Windows.
 * - Same fonts (Six Caps & DM Sans) are loaded via head link in layout.tsx.
 */

// Critical Font Variables
export const displayClassName = "font-display";
export const sansClassName = "font-sans";

// Handwritten font CSS variable (system fonts) - identical to previous logic
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
