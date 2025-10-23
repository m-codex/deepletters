/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // --- Custom Fonts ---
      fontFamily: {
        sans: ["QuattrocentoSans-Regular", "sans-serif"],
        serif: ["Quattrocento-Regular", "sans-serif"],
        heading: ["Quattrocento-Bold", "serif"],
      },
      
      // --- Custom Colors ---
      colors: {
        'primary-bg': 'var(--color-primary-bg)',
        'secondary-bg': 'var(--color-secondary-bg)',
        'tertiary-bg': 'var(--color-tertiary-bg)',
        'primary': 'var(--color-primary)',
        'secondary': 'var(--color-secondary)',
        'border': 'var(--color-border)',
        'white': 'var(--color-white)',
        'accent': 'var(--color-accent)',
        'btn-primary': 'var(--color-btn-primary)',
        'btn-hover': 'var(--color-btn-hover)',
        'btn-secondary': 'var(--color-btn-secondary)',
        'btn-secondary-text': 'var(--color-btn-secondary-text)',
      },
    },
  },
  plugins: [],
};
