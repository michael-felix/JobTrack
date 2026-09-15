import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        paper: "#FAF6EF",
        "paper-dark": "#1D1912",
        surface: "#FFFFFF",
        "surface-dark": "#26201A",
        ink: "#2A231C",
        "ink-dark": "#F3EAE0",
        "ink-muted": "#71624F",
        "ink-muted-dark": "#BBAB94",
        "ink-faint": "#A79A87",
        "ink-faint-dark": "#8A7C68",
        hairline: "#E8DECD",
        "hairline-dark": "#3B3225",
        accent: "#BD5B36",
        "accent-hover": "#A24827",
        "accent-dark": "#E0895C",
        "accent-hover-dark": "#EC9C71",
        "accent-soft": "#F3E2D2",
        "accent-soft-dark": "#3D2A1C",
        stage: {
          saved: "#8C8170",
          applied: "#A9822A",
          screening: "#8B6A9C",
          interview: "#BD5B36",
          offer: "#4C7A5B",
          rejected: "#A14B3F",
        },
        "stage-dark": {
          saved: "#B0A48D",
          applied: "#D9AE52",
          screening: "#C09FD1",
          interview: "#E0895C",
          offer: "#77A98A",
          rejected: "#D28477",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(42, 35, 28, 0.05), 0 1px 12px rgba(42, 35, 28, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
