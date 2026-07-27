/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enables class-based dark mode
  theme: {
    extend: {
      colors: {
        // Bespoke color palette matching design screenshots
        kgp: {
          blue: {
            50: '#f0f6ff',
            100: '#e0edff',
            200: '#c2dbff',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            950: '#0b0f19',
          },
          slate: {
            900: '#0f172a',
            950: '#030712',
          }
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 15px rgba(59, 130, 246, 0.5)',
        'glow-orange': '0 0 15px rgba(249, 115, 22, 0.5)',
        'glow-green': '0 0 15px rgba(34, 197, 94, 0.5)',
      }
    },
  },
  plugins: [],
}
