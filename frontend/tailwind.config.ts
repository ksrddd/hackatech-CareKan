import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gov: {
          ink:            'var(--gov-ink)',
          yellow:         'var(--gov-yellow)',
          primary:        'var(--gov-primary)',
          'primary-dark': 'var(--gov-primary-dark)',
          'primary-tint': 'var(--gov-primary-tint)',
          'wait-bg':      'var(--gov-wait-bg)',
          'wait-ink':     'var(--gov-wait-ink)',
          'ok-bg':        'var(--gov-ok-bg)',
          'ok-ink':       'var(--gov-ok-ink)',
          'err-bg':       'var(--gov-err-bg)',
          'err-ink':      'var(--gov-err-ink)',
          border:         'var(--gov-border)',
        },
      },
      fontFamily: {
        sans: ['LINE Seed Sans TH', 'Sarabun', 'Noto Sans Thai', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [forms],
};

export default config;
