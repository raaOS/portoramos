// Google Fonts: Six Caps, DM Sans, dan Merriweather
import { Six_Caps, DM_Sans, Merriweather } from 'next/font/google'

// Six Caps - Display font
export const sixCaps = Six_Caps({
  variable: '--font-display',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  preload: true,
  fallback: ['Arial Narrow', 'sans-serif'],
})

// DM Sans - Body font (clean, geometric, modern)
export const dmSans = DM_Sans({
  variable: '--font-sans', // Renamed to font-sans to be accurate
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: true,
  fallback: ['Arial', 'sans-serif'],
})

// Merriweather - Serif font (elegant, editorial)
export const merriweather = Merriweather({
  variable: '--font-serif', // Using font-serif for actual serif
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  display: 'swap',
  preload: true,
  fallback: ['Georgia', 'serif'],
})

export const displayClassName = `${sixCaps.variable} ${sixCaps.className}`
export const sansClassName = `${dmSans.variable} ${dmSans.className}`
export const serifClassName = `${merriweather.variable} ${merriweather.className}`
