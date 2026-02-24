/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Override Tailwind's blue palette with a dark-blue theme
        blue: {
          50: '#eaf0f8',
          100: '#d2e0f2',
          200: '#a6c1e6',
          300: '#7a9fd4',
          400: '#4f7ec2',
          500: '#0b3d91',
          600: '#0a356f',
          700: '#08294f',
          800: '#061a33',
          900: '#030d1a'
        },
        // Alias `primary` to the dark blue for convenience
        primary: {
          DEFAULT: '#0b3d91',
          50: '#eaf0f8',
          100: '#d2e0f2',
          200: '#a6c1e6',
          300: '#7a9fd4',
          400: '#4f7ec2',
          500: '#0b3d91',
          600: '#0a356f',
          700: '#08294f',
          800: '#061a33',
          900: '#030d1a'
        }
      }
    },
  },
  plugins: [],
};
