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
        // Background Colors
        'primary-bg': '#262626', 
        'secondary-bg': '#363636', 
        
        // Text Colors
        'primary': '#F0EEED',  
        'secondary': '#b3b3b3',
        'white': '#FFFFFF',    

        // Button Colors
        'btn-primary': '#af9888', // #AF9888  
        'btn-hover': '#998578',     
        'btn-secondary': '#E3DFDC', 
        'btn-secondary-text': '#262626', 
      },
    },
  },
  plugins: [],
};
