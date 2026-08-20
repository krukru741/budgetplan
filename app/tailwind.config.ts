import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary:   { DEFAULT: '#2563EB', hover: '#1D4ED8', light: '#DBEAFE', foreground: '#FFFFFF' },
        success:   { DEFAULT: '#16A34A', light: '#DCFCE7' },
        warning:   { DEFAULT: '#F59E0B', light: '#FEF3C7' },
        danger:    { DEFAULT: '#DC2626', light: '#FEE2E2' },
        info:      { DEFAULT: '#0EA5E9', light: '#E0F2FE' },
        surface:   { DEFAULT: '#FFFFFF', raised: '#F1F5F9' },
        background: '#F8FAFC',
        border:    { DEFAULT: '#E2E8F0', subtle: '#F1F5F9' },
        text: {
          DEFAULT:   '#0F172A',
          secondary: '#64748B',
          tertiary:  '#94A3B8',
          inverse:   '#FFFFFF',
        },
      },
      borderRadius: {
        sm:   '8px',
        md:   '12px',
        lg:   '16px',
        xl:   '20px',
        '2xl': '24px',
      },
      boxShadow: {
        sm:  '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md:  '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        lg:  '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
      },
      animation: {
        'fade-in':      'fadeIn 0.2s ease-out',
        'slide-up':     'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down':   'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in':     'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'spin-slow':    'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                     to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}

export default config
