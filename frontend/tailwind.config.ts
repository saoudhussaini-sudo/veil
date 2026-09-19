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
          DEFAULT: "rgba(212, 175, 55, 0.12)",
          subtle: "rgba(255, 255, 255, 0.08)",
          highlight: "rgba(212, 175, 55, 0.30)",
          gold: "#D4AF37",
        },
        gold: {
          DEFAULT: "#D4AF37",
          bright: "#F0C75E",
          muted: "#A8872D",
          glow: "rgba(212, 175, 55, 0.12)",
          dark: "#8C7020",
        },
        veil: {
          bg: "#050505",
          card: "#0D0D0D",
          input: "#090909",
          elevated: "#111111",
          border: "rgba(212, 175, 55, 0.12)",
          borderHover: "rgba(212, 175, 55, 0.30)",
          primary: "#D4AF37",
          bright: "#F0C75E",
          muted: "#A8872D",
          text: "#F5F5F0",
          secondaryText: "#A6A6A0",
          mutedText: "#666660",
          success: "#32D583",
          error: "#FF5C67",
          warning: "#D4AF37",
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
