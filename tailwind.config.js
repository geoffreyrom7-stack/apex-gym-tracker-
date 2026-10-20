/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Manrope", "Inter", "ui-sans-serif", "sans-serif"],
      },
      colors: {
        ink: "#090909",
        panel: "#121212",
        line: "#292929",
        muted: "#a5a5a5",
        blood: "#c1121f",
      },
      boxShadow: {
        soft: "0 20px 60px rgba(0, 0, 0, 0.24)",
      },
    },
  },
  plugins: [],
};
