/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    fontFamily: {
      logo: ['Open Sans', 'sans-serif'],
    },
    extend: {
      colors: {
        plutus: {
          bg: '#f4f6f8',
          surface: '#ffffff',
          border: 'rgba(15, 23, 42, 0.08)',
          text: '#0f172a',
          muted: '#64748b',
          primary: '#0d9488',
          'primary-dark': '#0f766e',
          violet: '#6366f1',
          amber: '#d97706',
        },
        'shadow-purple-100': '#CEB0FF',
      },
      borderRadius: {
        plutus: '12px',
        'plutus-lg': '16px',
      },
      boxShadow: {
        plutus: '0 1px 2px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(15, 23, 42, 0.04)',
        'plutus-hover':
          '0 4px 12px rgba(15, 23, 42, 0.08), 0 12px 32px rgba(15, 23, 42, 0.06)',
      },
      height: {
        '10v': '10vh',
        '20v': '20vh',
        '30v': '30vh',
        '40v': '40vh',
        '50v': '50vh',
        '60v': '60vh',
        '70v': '70vh',
        '75v': '75vh',
        '80v': '80vh',
        '85v': '85vh',
        '90v': '90vh',
        '100v': '100vh',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
