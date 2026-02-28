import { Six_Caps, DM_Sans } from 'next/font/google'

/**
 * Font Optimization Strategy:
 * - Only 2 fonts preloaded (critical for LCP)
 * - Display fonts: Six_Caps (headers)
 * - Body fonts: DM_Sans (content)
 * - Handwritten fonts for sticky notes: Use system cursive stack (performance over aesthetics)
 */

// Six Caps - Display font (Critical for Branding)
export const sixCaps = Six_Caps({
  variable: '--font-display',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  preload: true,
  fallback: ['Arial Narrow', 'Arial', 'sans-serif'],
  adjustFontFallback: true,
})

// DM Sans - Body font (Critical for content)
export const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Arial', 'sans-serif'],
})

/**
 * Sticky note fonts - Use system cursive stack for performance
 * Instead of loading 3 Google Fonts (Caveat, Indie_Flower, Patrick_Hand),
 * we use system fonts that are instantly available.
 * 
 * Performance gain: ~60KB less font downloads, 0ms font load time
 */
const handwrittenFontStack = `
  'Comic Sans MS', 
  'Chalkboard SE', 
  'Bradley Hand', 
  'Marker Felt', 
  'Segoe Print', 
  cursive, 
  sans-serif
`;

export const displayClassName = `${sixCaps.variable} ${sixCaps.className}`

// Only include critical fonts in className
export const sansClassName = `${dmSans.variable} ${dmSans.className}`

// Handwritten font CSS variable (system fonts)
export const handwrittenFontVar = `--font-handwritten: ${handwrittenFontStack};`
