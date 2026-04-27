/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF3FB', // light (correct)
          100: '#929CB7', // medium/dark
          500: '#195791', // main brand color
          600: '#132442', // darkest
        },
      },
      fontFamily:{
        roboto: ['Roboto', 'sans-serif'],
        orbitron:['Orbitron', 'sans-serif']
      }
    },
  },
  plugins: [],
}