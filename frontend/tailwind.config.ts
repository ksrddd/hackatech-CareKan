import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gov: {
          ink: '#14213d',
          yellow: '#f9c80e',
          primary: '#1b4d8c',
          'primary-dark': '#143b6e',
          'primary-tint': '#e7eef7',
          'wait-bg': '#fff4d6',
          'wait-ink': '#7a4a00',
          'ok-bg': '#e3f1e1',
          'ok-ink': '#1f5e22',
          'err-bg': '#fbe1e1',
          'err-ink': '#8a1d1d',
          border: '#c8ccd2',
        },
      },
      fontFamily: {
        sans: ['Sarabun', 'Noto Sans Thai', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [forms],
};

export default config;
