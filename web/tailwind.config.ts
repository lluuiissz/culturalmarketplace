import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#fdf8f0', 100: '#f9edd8', 500: '#b4651e', 600: '#96531a', 700: '#7a4316', 900: '#43230d' },
        clay: { 500: '#a0522d', 700: '#6b3410' },
        leaf: { 500: '#4d7c0f', 700: '#3f6212' },
      },
      fontFamily: { serif: ['Georgia', 'Cambria', 'serif'] },
    },
  },
  plugins: [],
};
export default config;
