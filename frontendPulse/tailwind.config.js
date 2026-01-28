import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a', // Slate 950
        surface: '#1e293b',    // Slate 800
        primary: '#3B82F6',
        secondary: '#10B981',
      }
    },
  },
  plugins: [
     tailwindcssAnimate,
  ],
}
