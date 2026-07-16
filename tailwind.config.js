/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        'short': { 'raw': '(max-height: 650px)' },
        '3xl': '1920px',
      },
      colors: {
        primary: {
          50: '#EFF3FB',
          100: '#929CB7',
          300: '#9DB9FF',
          500: '#195791',
          600: '#201E1E',
          700: '#D9D9D9',
          800: '#201E1E'
        },
      },
      fontFamily:{
        roboto: ['Roboto', 'sans-serif'],
        orbitron:['Orbitron', 'sans-serif'],
        fustat:['Fustat', 'sans-serif'],
        inter:['Inter', 'sans-serif'],
        kapakana:['Kapakana', 'cursive'],
      }
    },
  },
  plugins: [],
}