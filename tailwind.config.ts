import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Six Caps untuk display/title
        display: ['var(--font-display)', 'Six Caps', 'Arial Narrow', 'sans-serif'],
        // DM Sans untuk body/sans
        sans: ['var(--font-sans)', 'DM Sans', 'Arial', 'sans-serif']
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        card: '0 8px 20px rgba(0,0,0,.06)',
        elevated: '0 10px 30px rgba(0,0,0,.12)'
      },
      colors: {
        brand: {
          DEFAULT: '#2563eb',
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a'
        }
      },
      keyframes: {
        'bounce-in': {
          '0%': { opacity: '0', transform: 'scale(0.7)' },
          '60%': { opacity: '1', transform: 'scale(1.1)' },
          '80%': { transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'bounce-in': 'bounce-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
    }
  },
  plugins: [],
}
export default config

// Force Tailwind Rebuild: standardized dock IDs v2
