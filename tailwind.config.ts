import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-space)", "sans-serif"],
      },
      colors: {
        /* Aligned with globals.css tokens (app: Colors.ts) */
        emerald: {
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          900: "#064e3b",
          950: "#022c22",
        },
        purple: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          900: "#4c1d95",
          950: "#2e1065",
        },
        gold: "#f59e0b",
        charcoal: "#111827",
        pitch: "#000000",
      },
      borderRadius: {
        "sl-sm": "var(--radius-sm)",
        "sl-md": "var(--radius-md)",
        "sl-lg": "var(--radius-lg)",
        "sl-xl": "var(--radius-xl)",
        "sl-2xl": "var(--radius-2xl)",
        "sl-3xl": "var(--radius-3xl)",
      },
      transitionTimingFunction: {
        "out-expo": "var(--ease-out-expo)",
        "out-circ": "var(--ease-out-circ)",
      },
      transitionDuration: {
        "150": "150ms",
        "250": "250ms",
        "400": "400ms",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-glow": "conic-gradient(from 90deg at 50% 50%, transparent 50%, #10b981 100%)",
      },
      animation: {
        shimmer: "shimmer 2.5s linear infinite",
        blob: "blob 7s var(--ease-out-circ) infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse-slow 8s var(--ease-out-circ) infinite",
        aurora: "aurora 10s var(--ease-out-circ) infinite",
        spotlight: "spotlight 2s ease-out 0.75s 1 forwards",
      },
      keyframes: {
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "0.08", transform: "scale(1)" },
          "50%": { opacity: "0.14", transform: "scale(1.05)" },
        },
        aurora: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        spotlight: {
          "0%": { opacity: "0", transform: "translate(-72%, -62%) scale(0.5)" },
          "100%": { opacity: "1", transform: "translate(-50%,-40%) scale(1)" },
        },
      },
    },
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function (api: any) {
      const { matchUtilities, theme } = api;
      matchUtilities(
        {
          "bg-grid": (value: string) => ({
            backgroundImage: `url("${svgGrid(value)}")`,
          }),
        },
        { values: theme("backgroundColor") ?? {} }
      );
    },
  ],
};

function svgGrid(color: string) {
  return `data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='${encodeURIComponent(
    color
  )}'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e`;
}

export default config;
