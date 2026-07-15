/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-obsidian)",
        foreground: "var(--text-primary)",
        card: "var(--bg-card)",
        border: "var(--border-glow)",
        muted: "var(--text-muted)",
        primary: {
          DEFAULT: "var(--border-glow)",
          foreground: "var(--text-primary)",
        },
        accent: {
          DEFAULT: "var(--border-glow)",
          foreground: "var(--text-primary)",
        },
      },
      backgroundImage: {
        "accent-gradient": "var(--accent-gradient)",
      },
      fontFamily: {
        sans: ["var(--font-source-sans)", '"Source Sans 3"', "sans-serif"],
        serif: ["var(--font-instrument-serif)", '"Instrument Serif"', "serif"],
        dm: ['"DM Sans"', "var(--font-source-sans)", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
