/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Instrument Serif"', "ui-serif", "Georgia", "serif"],
        sans: [
          '"Geist"',
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        mono: ['"Geist Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        ink: {
          950: "#0a0806",
          900: "#100c08",
          800: "#181310",
          700: "#221a15",
          600: "#2e231c",
          500: "#3a2d24",
        },
        ember: {
          50: "#fff7e6",
          100: "#ffebb8",
          200: "#ffd880",
          300: "#ffc24d",
          400: "#ffaa1f",
          500: "#f08b00",
          600: "#c46a00",
          700: "#8a4700",
        },
      },
      boxShadow: {
        glow: "0 10px 60px -10px rgba(240, 139, 0, 0.35)",
        tile: "inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 0 rgba(0,0,0,0.4)",
      },
      backgroundImage: {
        "ember-radial":
          "radial-gradient(80% 60% at 50% 0%, rgba(240,139,0,0.18) 0%, rgba(240,139,0,0.04) 40%, transparent 70%)",
        "grain":
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      },
    },
  },
  plugins: [],
};
