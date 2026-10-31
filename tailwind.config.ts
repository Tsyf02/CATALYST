import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--color-paper)",
        paperline: "var(--color-paperline)",
        ink: "var(--color-ink)",
        inksoft: "var(--color-inksoft)",
        red: "#C1272D",
        amber: "#B8791A",
        acara: "#3E6E78",
        kerja: "#A6763D",
        lomba: "#6E5390",
        lainnya: "#5E6B4C",
        cardbg: "var(--color-cardbg)",
      },
      fontFamily: {
        display: ["Georgia", "Times New Roman", "serif"],
        mono: ["ui-monospace", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
