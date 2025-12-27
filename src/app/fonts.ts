// Google Fonts: Six Caps, DM Sans
import { Six_Caps, DM_Sans } from 'next/font/google'

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

export const displayClassName = `${sixCaps.variable} ${sixCaps.className}`
export const sansClassName = `${dmSans.variable} ${dmSans.className}`
