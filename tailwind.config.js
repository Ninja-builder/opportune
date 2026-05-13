// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: 'hsl(210, 40%, 55%)',
        accent: 'hsl(260, 70%, 60%)',
        glass: 'rgba(255, 255, 255, 0.1)'
      },
      backdropBlur: {
        xs: '2px'
      },
      animation: {
        gradient: 'gradient 8s ease infinite'
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        }
      }
    }
  },
  plugins: []
};
