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
          base: '#0A0A0A',
          nav: '#0F0F0F',
          card: '#141414',
          elevated: '#1C1C1E',
          hover: '#222224',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#9D9DA3',
          muted: '#6B6B73',
        },
        gray: {
          700: '#333333',
          800: '#2C2C2E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
