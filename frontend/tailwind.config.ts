import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050505",
        surface: {
          subtle: "#080808",
          card: "#0D0D0D",
          input: "#090909",
          elevated: "#111111",
          hover: "#141414",
        },
        border: {
          DEFAULT: "rgba(201, 164, 92, 0.12)",
          subtle: "rgba(255, 255, 255, 0.08)",
          highlight: "rgba(201, 164, 92, 0.30)",
          gold: "#C9A45C",
        },
        gold: {
          DEFAULT: "#C9A45C",
          bright: "#D8B46E",
          secondary: "#C9A96E",
          muted: "#A68343",
          glow: "rgba(201, 164, 92, 0.12)",
          dark: "#886F3F",
        },
        veil: {
          bg: "#050505",
          card: "#0D0D0D",
          input: "#090909",
          elevated: "#111111",
          border: "rgba(201, 164, 92, 0.12)",
          borderHover: "rgba(201, 164, 92, 0.30)",
          primary: "#C9A45C",
          bright: "#D8B46E",
          muted: "#A68343",
          text: "#F5F5F0",
          secondaryText: "#A6A6A0",
          mutedText: "#666660",
          success: "#32D583",
          error: "#FF5C67",
          warning: "#C9A45C",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest: "0.18em",
      },
    },
  },
  plugins: [],
};

export default config;
