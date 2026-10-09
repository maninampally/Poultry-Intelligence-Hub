/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep agricultural green — primary brand color (from mockups)
        brand: {
          DEFAULT: "#2e7d52",
          50: "#eef7f1",
          100: "#d5ecdd",
          200: "#abd8bc",
          300: "#7cbf96",
          400: "#4fa172",
          500: "#2e7d52",
          600: "#256541",
          700: "#1f5236",
          800: "#1a422c",
          900: "#153524",
        },
        // Muted amber — "needs attention" states
        amber: {
          DEFAULT: "#e08a2b",
          soft: "#fdf3e6",
          text: "#b06a17",
        },
        // Red — mortality / critical
        danger: {
          DEFAULT: "#d64545",
          soft: "#fbeaea",
          text: "#b23333",
        },
        // Calm green — healthy / normal
        ok: {
          DEFAULT: "#2e7d52",
          soft: "#e7f4ec",
          text: "#256541",
        },
        // Neutral surfaces — cream / white cards
        cream: "#faf8f3",
        surface: "#ffffff",
        border: "#e8e6e0",
        ink: {
          DEFAULT: "#1f2723",
          muted: "#6b746e",
          faint: "#9aa19c",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
      borderRadius: {
        card: "16px",
        pill: "999px",
      },
    },
  },
  plugins: [],
};
