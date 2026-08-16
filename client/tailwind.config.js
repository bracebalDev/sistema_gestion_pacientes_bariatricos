/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00A3E0',
          light: '#38BDF8',
          dark: '#0284C7'
        },
        sidebar: {
          bg: '#1E1E1E',
          hover: '#2D2D2D',
          active: '#383838'
        }
      }
    },
  },
  plugins: [],
}
