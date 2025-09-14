import { defineConfig } from '@tailwindcss/vite'

export default defineConfig({
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          300: '#94A3B8',
          500: '#6366F1',
          700: '#4338CA',
        },
        // Modern slate/indigo theme
        blue: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#94A3B8',
          400: '#64748B',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        // Slate as accent colors
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#94A3B8',
          400: '#64748B',
          500: '#475569',
          600: '#334155',
          700: '#1E293B',
          800: '#0F172A',
          900: '#020617',
        }
      },
      backgroundColor: {
        // Modern theme backgrounds
        'default': '#F8FAFC',
        'primary': '#6366F1',
        'primary-light': '#94A3B8',
        'primary-dark': '#4338CA',
      },
      textColor: {
        'primary': '#4338CA',
        'primary-light': '#6366F1',
        'primary-dark': '#3730A3',
      },
      borderColor: {
        'primary': '#6366F1',
        'primary-light': '#94A3B8',
        'primary-dark': '#4338CA',
      },
      ringColor: {
        'primary': '#6366F1',
      },
      boxShadow: {
        'primary': '0 4px 14px 0 rgba(99, 102, 241, 0.25)',
        'primary-lg': '0 10px 25px -3px rgba(99, 102, 241, 0.3)',
      }
    },
  },
})
