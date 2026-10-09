export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: 'var(--brand)',
        ink: '#0B132B',
        surface: '#1C2541',
        elevated: '#253256',
        accent: '#3182CE',
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
