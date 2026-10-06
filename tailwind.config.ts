import type { Config } from "tailwindcss";

const config = {
  theme: {
    extend: {
      colors: {
        primary: "#15803D",
        accent: "#F97316",
        background: "#F8FAF9",
        surface: "#FFFFFF",
        main: "#111827",
        secondary: "#6B7280",
        border: "#E5E7EB",
      },
      fontFamily: {
        sans: [
          "var(--font-plus-jakarta-sans)",
          "Plus Jakarta Sans",
          "sans-serif",
        ],
      },
    },
  },
} satisfies Config;

export default config;
