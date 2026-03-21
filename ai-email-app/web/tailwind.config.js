/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fdfbf7',
          100: '#f7f0e6',
          200: '#ede4d3',
          300: '#e0d4bc',
          400: '#d1c0a5',
        },
        ink: {
          700: '#3d3429',
          800: '#2c2419',
          900: '#1a1510',
        },
        accent: {
          DEFAULT: '#8b6914',
          hover: '#6d5210',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        paper: '0 1px 3px rgba(26, 21, 16, 0.06), 0 12px 40px rgba(26, 21, 16, 0.08)',
      },
    },
  },
  plugins: [],
};
