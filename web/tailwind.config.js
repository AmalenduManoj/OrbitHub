/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7C3AED',
          hover: '#6D28D9',
          light: '#9D5CFF',
        },
        accent: {
          pink: '#EC4899',
          blue: '#60A5FA',
          lavender: '#C084FC',
        },
        bg: {
          base: '#080812',
          nav: '#0F172A',
          card: '#141428',
          hover: '#1B1B35',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A1A1AA',
          muted: '#71717A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
