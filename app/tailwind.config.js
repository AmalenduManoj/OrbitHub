/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0A0A0A',
        'bg-card': '#141414',
        'bg-hover': '#1C1C1E',
        'text-primary': '#FFFFFF',
        'text-secondary': '#9D9DA3',
        'text-muted': '#636366',
        primary: '#7C3AED',
        'primary-hover': '#6D28D9',
        'primary-light': '#A78BFA',
        nav: '#0A0A0A',
      },
    },
  },
  plugins: [],
};
