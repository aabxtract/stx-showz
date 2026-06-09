import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
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
