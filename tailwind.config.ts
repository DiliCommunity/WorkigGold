import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0e14",
        foreground: "#e6e8eb",
        primary: {
          DEFAULT: "#d4af37",
          dark: "#b8941f",
          light: "#e8c960",
        },
        secondary: {
          DEFAULT: "#2dd4bf",
          dark: "#14b8a6",
          light: "#5eead4",
        },
        accent: {
          green: "#10b981",
          ocean: "#0891b2",
          dark: "#1a2332",
        },
        card: {
          DEFAULT: "#141b26",
          hover: "#1e2938",
        },
      },
    },
  },
  plugins: [],
};
export default config;
