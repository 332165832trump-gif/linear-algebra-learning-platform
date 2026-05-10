export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Consolas", "monospace"]
      },
      colors: {
        ink: "#070A12",
        midnight: "#0B1020",
        panel: "#101521",
        line: "#263145",
        cyanGlow: "#5EEAD4",
        skyMath: "#60A5FA",
        vectorGold: "#F6C86E",
        invariantGreen: "#6EE7B7",
        eigenPurple: "#C084FC",
        gold: "#F6C86E",
        roseMath: "#F87171"
      },
      boxShadow: {
        glow: "0 0 40px rgba(94, 234, 212, 0.18)",
        gold: "0 0 34px rgba(246, 200, 110, 0.16)"
      }
    }
  },
  plugins: []
};
