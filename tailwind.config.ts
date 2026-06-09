import type { Config } from 'tailwindcss'
const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: { DEFAULT: '#00B4D8', dark: '#0096B7' },
        purple: { DEFAULT: '#7B2FBE', dark: '#6324A0' },
        brand: { dark: '#0D1B2A', darker: '#060E17' },
      },
      borderRadius: { lg: '0.75rem', md: '0.5rem', sm: '0.375rem' },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
