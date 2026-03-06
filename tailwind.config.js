
/* eslint-env node */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        "bg-primary": "#080810",
        "bg-secondary": "#0f0f1a",
        "bg-card": "#12121f",
        border: "#1e1e2e",
        "border-hover": "#2e2e3e",
        muted: "#64748b",
        "accent-blue": "#00d4ff",
        "accent-green": "#00ff88",
        "accent-purple": "#a855f7",
        "accent-orange": "#f97316",
        "accent-cyan": "#22d3ee",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-blue": "0 0 20px rgba(0, 212, 255, 0.3)",
        "glow-green": "0 0 20px rgba(0, 255, 136, 0.3)",
        "glow-blue-sm": "0 0 10px rgba(0, 212, 255, 0.25)",
        "glow-green-sm": "0 0 10px rgba(0, 255, 136, 0.25)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
}
