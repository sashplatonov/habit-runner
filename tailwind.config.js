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
        "bg-primary": "var(--bg-primary)",
        "bg-secondary": "var(--bg-secondary)",
        "bg-card": "var(--bg-card)",
        border: "var(--border)",
        "border-hover": "var(--border-hover)",
        foreground: "var(--text-primary)",
        muted: "var(--text-muted)",
        accent: "var(--accent)",
        "accent-secondary": "var(--accent-secondary)",
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
