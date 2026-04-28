/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        brand: {
          50:  '#EEF3F8',
          100: '#D6E1ED',
          200: '#AEC2DA',
          300: '#7E9BC0',
          400: '#52739F',
          500: '#345580',
          600: '#244167',
          700: '#1E3A5F',
          800: '#162A45',
          900: '#0F1D31',
        },
        accent: {
          50:  '#ECF5F0',
          100: '#D2E7DB',
          200: '#A6CFB8',
          300: '#76B393',
          400: '#4F9772',
          500: '#3A7556',
          600: '#2F6B4F',
          700: '#235640',
          800: '#1A4030',
          900: '#102A1F',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 29 49 / 0.04), 0 1px 3px 0 rgb(15 29 49 / 0.06)',
        'card-hover': '0 4px 6px -2px rgb(15 29 49 / 0.05), 0 10px 15px -3px rgb(15 29 49 / 0.08)',
        ring: '0 0 0 4px rgb(36 65 103 / 0.12)',
      },
      borderRadius: {
        xl: '0.875rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'slide-in-right': 'slide-in-right 200ms ease-out',
      },
    },
  },
  plugins: [],
};
