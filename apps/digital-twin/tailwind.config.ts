import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#070b16',
        panel: '#0e1626',
        panel2: '#131f35',
        edge: '#23314f',
        holo: '#22d3ee',
        brand: '#0ea5e9',
        glow: '#7c3aed',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        panel: '0 10px 40px rgba(0,0,0,0.45)',
        glow: '0 0 30px rgba(34,211,238,0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
