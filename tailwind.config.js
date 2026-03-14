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
        // Custom dark theme palette — darker flat aesthetic
        canvas: {
          bg: '#0d0d0d',
          surface: '#141414',
          border: '#2a2a2a'
        },
        node: {
          bg: '#1a1a1a',
          header: '#222222',
          border: '#333333',
          selected: '#89b4fa'
        }
      }
    }
  },
  plugins: []
}
