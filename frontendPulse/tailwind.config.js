import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'selector',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        'border-main': 'var(--border-main)',
        'text-main': 'var(--text-primary)',
        'text-muted': 'var(--text-secondary)',
        primary: '#3B82F6',
        secondary: '#10B981',
      }
    },
  },
  plugins: [
     tailwindcssAnimate,
  ],
}
