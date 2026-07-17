import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Identidade azul da Lustosa Tech. Escala ancorada no #3a5da8, um azul
        // editorial (navy) que conversa com a base creme/escura do site — sem
        // neon, sofisticado e moderno.
        brand: {
          50: "#f0f4fb",
          100: "#dde8f6",
          200: "#c2d5ef",
          300: "#9bb9e3", // accent no dark mode
          400: "#6e97d4",
          500: "#4d79c4",
          600: "#3a5da8", // accent no light mode (primário)
          700: "#324c89",
          800: "#2d4171",
          900: "#29395e",
          950: "#1b2440",
        },
        // Tokens semânticos ligados às CSS vars (light/dark automáticos).
        // Formato rgb(var(--x) / <alpha-value>) para que os modificadores de
        // opacidade do Tailwind (bg-accent/10, border-accent/40) funcionem.
        surface: "rgb(var(--surface-rgb) / <alpha-value>)",
        "surface-fg": "rgb(var(--surface-fg-rgb) / <alpha-value>)",
        accent: "rgb(var(--accent-rgb) / <alpha-value>)",
        "accent-hover": "rgb(var(--accent-hover-rgb) / <alpha-value>)",
        "accent-contrast": "rgb(var(--accent-contrast-rgb) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
