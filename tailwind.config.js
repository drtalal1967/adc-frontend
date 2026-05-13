/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F4F7FB',
        primary: {
          DEFAULT: '#2C4697',
          50: '#EEF3FB',
          100: '#DDE8F7',
          200: '#B9CDEE',
          300: '#8EADE1',
          400: '#5F86D0',
          500: '#2C4697',
          600: '#243C86',
          700: '#1C335F',
          800: '#152947',
          900: '#0F1F36',
          dark: '#1C335F',
        },
        secondary: {
          DEFAULT: '#F58220',
          50: '#FFF4EA',
          100: '#FFE5CF',
          200: '#FFC99D',
          300: '#FFAA69',
          400: '#FB923C',
          500: '#F58220',
          600: '#D96B0D',
          700: '#B6550A',
          800: '#8F410C',
          900: '#73360F',
        },
        accent: '#F58220',
        success: '#2C4697',
        warning: '#F58220',
        danger: {
          DEFAULT: '#F58220',
          50: '#FFF4EA',
          100: '#FFE5CF',
          500: '#F58220',
          600: '#D96B0D',
        },
        sidebar: {
          DEFAULT: '#0F1F36',
          hover: '#1C335F',
          active: '#F58220',
        },
        card: '#FFFFFF',
        brand: {
          blue: '#2C4697',
          navy: '#1C335F',
          orange: '#F58220',
          silver: '#AEB7C2',
          mist: '#EEF3FB',
        },
      },
      boxShadow: {
        soft: '0 18px 50px rgba(44, 70, 151, 0.08)',
        card: '0 1px 3px 0 rgba(44,70,151,0.08), 0 4px 16px 0 rgba(44,70,151,0.06)',
        'card-hover': '0 8px 32px 0 rgba(44,70,151,0.14), 0 2px 8px 0 rgba(44,70,151,0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'ui-sans-serif', 'system-ui'],
        heading: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
