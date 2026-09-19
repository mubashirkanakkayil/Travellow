/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./pages/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        secondaryBg: "#FAF8F5",
        primaryText: "#111111",
        bodyText: "#555555",
        mutedText: "#777777",
        borderLine: "#E8E5E1",
        coral: {
          50: "#FFF8F6",
          100: "#FFF1ED",
          500: "#FF6B57",
          600: "#F05A47",
          700: "#D94533",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-outfit)", "sans-serif"],
      },
      maxWidth: {
        container: "1280px",
      },
    },
  },
  plugins: [],
};
