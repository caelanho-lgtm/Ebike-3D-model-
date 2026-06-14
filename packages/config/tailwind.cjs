/**
 * Shared Tailwind preset for @dtf apps (widget, console).
 * Real apps extend this via `presets: [require('@dtf/config/tailwind')]`.
 * Tailwind itself is added in the Widget-app slice; this preset is the seed.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        holo: {
          DEFAULT: '#4fd0ff',
          deep: '#05070d',
          band: { ok: '#6ee7a8', low: '#ffd27f', high: '#ff9b9b' },
        },
      },
    },
  },
  plugins: [],
};
