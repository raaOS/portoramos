import { Six_Caps, DM_Sans, Caveat, Indie_Flower, Patrick_Hand } from 'next/font/google'
import localFont from 'next/font/local'

// Six Caps - Display font
export const sixCaps = Six_Caps({
  variable: '--font-display',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  preload: true,
  fallback: ['Arial Narrow', 'sans-serif'],
})

export const dmSans = DM_Sans({
  variable: '--font-sans', // Renamed to font-sans to be accurate
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: true,
  fallback: ['Arial', 'sans-serif'],
})

export const caveat = Caveat({
  variable: '--font-caveat',
  subsets: ['latin'],
  display: 'swap',
})

export const indieFlower = Indie_Flower({
  variable: '--font-indie',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
})

export const patrickHand = Patrick_Hand({
  variable: '--font-patrick',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
})



export const displayClassName = `${sixCaps.variable} ${sixCaps.className}`
// alaNanti removed for performance
export const sansClassName = `${dmSans.variable} ${dmSans.className} ${caveat.variable} ${indieFlower.variable} ${patrickHand.variable}`
