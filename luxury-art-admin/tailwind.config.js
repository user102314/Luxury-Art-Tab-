/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      colors: {
        gold: {
          50: '#fbf8f1',
          100: '#f5eed9',
          200: '#ead9ae',
          300: '#ddbf7a',
          400: '#cfa34d',
          500: '#b8873a',
          600: '#9c6a2f',
          700: '#7d5129',
          800: '#674226',
          900: '#573724',
        },
        ink: {
          950: '#0a0a0b',
          900: '#121214',
          800: '#1a1a1f',
          700: '#25252d',
          600: '#32323c',
        },
      },
    },
  },
  plugins: [],
}
