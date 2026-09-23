/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'hk-bg': '#FFFFFF', 
        'hk-primary': '#1E293B', 
        'hk-accent': '#D97757', 
        'hk-text': '#333333',
      },
      fontFamily: {
        sans: ['"Noto Sans HK"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
