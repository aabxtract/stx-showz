import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    screens: {
      xs: "400px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        slate: {
          50: "var(--slate-50)",
          100: "var(--slate-100)",
          200: "var(--slate-200)",
          300: "var(--slate-300)",
          400: "var(--slate-400)",
          500: "var(--slate-500)",
          600: "var(--slate-600)",
          700: "var(--slate-700)",
          800: "var(--slate-800)",
          900: "var(--slate-900)",
        },
        brand: {
          50: "#f3f1ff",
          100: "#e9e4ff",
          200: "#d3cbff",
          300: "#b3a4ff",
          400: "#8f74ff",
          500: "#6d49ff",
          600: "#5a30f0",
          700: "#4a23cc",
          800: "#3c1ea4",
          900: "#321c83",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 6px 24px -6px rgba(40, 20, 80, 0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
