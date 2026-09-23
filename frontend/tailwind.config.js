/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // "Showroom at night" palette — brushed gold on deep charcoal,
        // matching the New Jeddah Motors mark.
        brand: {
          50: "#FBF7ED",
          100: "#F3E9CC",
          200: "#E8D5A0",
          300: "#DDBF74",
          400: "#D2AC58",
          500: "#C9A961",
          600: "#B08A3E",
          700: "#8C6B2F",
          800: "#5C471F",
          900: "#141311",
          950: "#0B0A09",
        },
        ink: {
          900: "#0B0D10",
          800: "#15181C",
          700: "#1C2025",
          600: "#262B31",
          500: "#34393F",
        },
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "serif"],
        sans: ["'Inter'", "sans-serif"],
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        scaleIn: {
          "0%": { opacity: 0, transform: "scale(0.96)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: 0.5 },
          "50%": { opacity: 1 },
        },
      },
      animation: {
        fadeInUp: "fadeInUp 0.5s ease both",
        fadeIn: "fadeIn 0.4s ease both",
        scaleIn: "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 2.5s linear infinite",
        float: "float 5s ease-in-out infinite",
        glowPulse: "glowPulse 2.5s ease-in-out infinite",
      },
      boxShadow: {
        gold: "0 8px 24px -8px rgba(201, 169, 97, 0.35)",
        card: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -12px rgba(20,19,17,0.12)",
      },
    },
  },
  plugins: [],
}
