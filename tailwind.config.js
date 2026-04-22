/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:'#195791',//dark blue
          100:'#EFF3FB', //light
          500:"#132442"//dark almost balck
        },
      },
    },
  },
  plugins: [],
}