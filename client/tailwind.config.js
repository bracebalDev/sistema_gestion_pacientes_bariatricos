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
          DEFAULT: '#2B8A8A',
          light: '#3AA8A8',
          dark: '#1F6B6B'
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
