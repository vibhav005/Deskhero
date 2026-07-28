import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        // Semantic tokens driven by CSS variables (see globals.css)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          soft: "hsl(var(--primary-soft))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          soft: "hsl(var(--accent-soft))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          soft: "hsl(var(--success-soft))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          soft: "hsl(var(--warning-soft))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        tier: {
          bronze: "hsl(var(--tier-bronze))",
          silver: "hsl(var(--tier-silver))",
          gold: "hsl(var(--tier-gold))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        xl: "calc(var(--radius) + 6px)",
        "2xl": "calc(var(--radius) + 12px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0, 0, 0, 0.16), 0 8px 24px rgba(0, 0, 0, 0.24)",
        lift: "0 2px 6px rgba(0, 0, 0, 0.2), 0 16px 40px rgba(0, 0, 0, 0.32)",
        "glow-primary": "0 0 0 1px hsl(var(--primary) / 0.4), 0 4px 20px hsl(var(--primary) / 0.35)",
        "glow-primary-lg": "0 0 0 1px hsl(var(--primary) / 0.45), 0 8px 32px hsl(var(--primary) / 0.5)",
        "glow-accent": "0 0 0 1px hsl(var(--accent) / 0.4), 0 4px 20px hsl(var(--accent) / 0.35)",
        "glow-success": "0 0 0 1px hsl(var(--success) / 0.4), 0 4px 20px hsl(var(--success) / 0.3)",
        "glow-gold": "0 0 0 1px hsl(var(--tier-gold) / 0.5), 0 4px 20px hsl(var(--tier-gold) / 0.4)",
        "glow-warning": "0 0 0 1px hsl(var(--warning) / 0.4), 0 4px 20px hsl(var(--warning) / 0.35)",
        "glow-bronze": "0 0 0 1px hsl(var(--tier-bronze) / 0.5), 0 4px 20px hsl(var(--tier-bronze) / 0.25)",
        "glow-silver": "0 0 0 1px hsl(var(--tier-silver) / 0.5), 0 4px 20px hsl(var(--tier-silver) / 0.25)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pop": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "60%": { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "pop": "pop 0.35s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
