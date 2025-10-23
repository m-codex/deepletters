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
        text: ["InterTight-Regular", "sans-serif"],
        subheading: ["InterTight-SemiBold", "sans-serif"],
        heading: ["InterTight-Bold", "sans-serif"],
      },

      // --- Custom Gradients ---
      backgroundImage: {
        // Beispiel: Ein Gradient für primäre Buttons #8567DC, #7659CC
        'gradient-primary-btn': 'linear-gradient(to right, #5f4bac, #483C8A)', 
        // Beispiel: Ein Gradient für Texte (kann angepasst werden)
        'gradient-text': 'linear-gradient(to right, #A19FD6, var(--color-primary))', 
      },
      // Diese Utility ist für Farbverlauf-Texte essentiell, um den Hintergrund auf den Text zu clippen
      backgroundClip: {
        'text': 'text',
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
