// Google Fonts: Bebas Neue dan Merriweather (Homepage menggunakan Merriweather)
import { Bebas_Neue, Merriweather } from 'next/font/google'

// Bebas Neue - Display font
export const bebasNeue = Bebas_Neue({
  variable: '--font-display',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  preload: true,
  fallback: ['Arial', 'sans-serif'],
})

// Merriweather - Body font
export const merriweather = Merriweather({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  display: 'swap',
  preload: true,
  fallback: ['Georgia', 'serif'],
})

export const displayClassName = `${bebasNeue.variable} ${bebasNeue.className}`
export const serifClassName = `${merriweather.variable} ${merriweather.className}`
