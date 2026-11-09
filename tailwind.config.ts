import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        hype: {
          black: "#09090B",
          panel: "#141319",
          purple: "#9B5CFF",
          lilac: "#C8A7FF",
          muted: "#A6A2AE"
        }
      },
      boxShadow: {
        glow: "0 0 35px rgba(155, 92, 255, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
