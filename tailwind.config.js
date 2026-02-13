module.exports = {
  content: [
    "./static/js/**/*.{js,jsx,ts,tsx}",
    "./static/css/**/*.css"
  ],
  theme: {
    extend: {
      keyframes: {
        scroll: {
          '0%': { transform: 'translateX(-50%)' },  // start shifted left
          '100%': { transform: 'translateX(0%)' },   // move right to original pos
        },
      },
      animation: {
        'scroll-horizontal': 'scroll 30s linear infinite',
      },
      screens: {
        'above-1070': '1071px',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.text-outline-white': {
          '-webkit-text-stroke': '1px white',
          'text-stroke': '1px white',
        }
      }
      addUtilities(newUtilities)
    }
  ]
}
