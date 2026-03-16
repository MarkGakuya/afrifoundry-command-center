/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ['var(--font-syne)', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: '#0e0e0e',
          1: '#141414',
          2: '#1a1a1a',
          3: '#222222',
          4: '#2a2a2a',
        },
        brand: {
          green: '#00ff88',
          amber: '#ffaa00',
          red: '#ff4444',
          blue: '#4488ff',
        },
        border: '#2a2a2a',
      },
    },
  },
  plugins: [],
};
