export default {
  content: [
    './academy-src/**/*.{html,js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Kufi Arabic', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        academy: {
          ink: '#030712',
          panel: '#07111f',
          cyan: '#5ee7ff',
          blue: '#4d7cff',
          violet: '#8d6bff',
          mint: '#74f7c2',
          line: 'rgba(148, 163, 184, 0.18)',
        },
      },
      boxShadow: {
        glow: '0 24px 90px rgba(65, 112, 255, 0.28)',
      },
    },
  },
  plugins: [],
};
