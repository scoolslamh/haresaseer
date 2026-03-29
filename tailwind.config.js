/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        moe: {
          50:  '#E8F7F1',
          100: '#C5EAD8',
          200: '#9ED8BB',
          300: '#73C69C',
          400: '#4DB882',
          500: '#3BAA72',
          600: '#2D9A62',
          700: '#1D8A52',
          800: '#1D7587',
          900: '#155560',
        },
      },
    },
  },
  plugins: [],
};
