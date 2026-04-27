/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f9',
          100: '#dce6f0',
          200: '#b8ccdf',
          300: '#8aadc9',
          400: '#5c8bb2',
          500: '#3d6d96',
          600: '#2e5679',
          700: '#1a3a5c',
          800: '#122840',
          900: '#0d1e30',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#22d3ee',
          500: '#0891b2',
          600: '#0e7490',
          700: '#155e75',
          800: '#164e63',
          900: '#083344',
        },
        mint: {
          50: '#f0fdfa',
        },
        // Severidad estados
        severity: {
          stable: '#10b981',    // emerald-500
          moderate: '#f59e0b',  // amber-500
          elevated: '#ef4444',  // rose-500
          crisis: '#7c3aed',    // violet-600
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      transitionDuration: {
        150: '150ms',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
