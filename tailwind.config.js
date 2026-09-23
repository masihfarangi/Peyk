/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#000000',
        paper: '#FFFFFF',
        mist: '#F2F2F2',
        line: '#E3E3E3',
        slate: '#6B6B6B',
        ash: '#9A9A9A',
        brand: '#CB2027',
        brandActive: '#A81A1F',
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        display: ['2.125rem', { lineHeight: '1', letterSpacing: '-0.045em', fontWeight: '700' }],
        title: ['1.375rem', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '600' }],
        body: ['0.9375rem', { lineHeight: '1.45', letterSpacing: '-0.011em' }],
        meta: ['0.8125rem', { lineHeight: '1.35', letterSpacing: '-0.005em' }],
      },
      borderRadius: {
        sheet: '28px',
        card: '20px',
        pill: '999px',
      },
      boxShadow: {
        float: '0 6px 24px -12px rgba(0,0,0,0.30)',
        sheet: '0 -10px 40px -24px rgba(0,0,0,0.45)',
      },
      spacing: {
        touch: '48px',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
