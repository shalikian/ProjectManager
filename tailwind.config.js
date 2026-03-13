/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/renderer/src/**/*.{js,ts,jsx,tsx}',
    './src/renderer/index.html'
  ],
  theme: {
    extend: {
      colors: {
        // Custom dark theme palette
        canvas: {
          bg: '#1a1a2e',
          surface: '#16213e',
          border: '#0f3460'
        },
        node: {
          bg: '#1e1e2e',
          header: '#313244',
          border: '#45475a',
          selected: '#89b4fa'
        }
      }
    }
  },
  plugins: []
}
