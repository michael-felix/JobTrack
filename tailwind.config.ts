import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        stage: {
          saved: "#64748b",
          applied: "#2563eb",
          screening: "#7c3aed",
          interview: "#d97706",
          offer: "#16a34a",
          rejected: "#dc2626",
        },
      },
    },
  },
  plugins: [],
};

export default config;
