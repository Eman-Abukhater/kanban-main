/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js",
  ],
  theme: {
    extend: {
      margin: {
        "-52": "-13rem", // Adjust the value to match your desired negative margin
      },
      fontFamily: {
        cool: ["YourCoolFont", "sans"], // Replace 'YourCoolFont' with the actual font name
      },
      animation: {
        bounce: "bounce 1s infinite",
        // Add more animation definitions as needed
      }, 
      backgroundColor: {
        'whitesmoke': 'whitesmoke',
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("tailwind-scrollbar")({ nocompatible: true }),
  ],
};

// import type { Config } from 'tailwindcss'

// const config: Config = {
//   content: [
//     './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
//     './src/components/**/*.{js,ts,jsx,tsx,mdx}',
//     './src/app/**/*.{js,ts,jsx,tsx,mdx}',
//   ],
//   theme: {
//     extend: {
//       backgroundImage: {
//         'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
//         'gradient-conic':
//           'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
//       },
//     },
//   },
//   plugins: [],
// }
// export default config
